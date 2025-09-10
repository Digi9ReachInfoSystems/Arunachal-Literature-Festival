import { EventDayCollection, EventsCollection,TimeCollection } from "../models/eventModel.js";
import PDFDocument from 'pdfkit'; // Assuming pdfdoc is PDFKit
// Removed unused luxon import
import mongoose from 'mongoose';

export const addEvent = async (req, res) => {
  try {
    const { name, description, year, month, startDate, endDate } = req.body;

    // --- VALIDATION ---
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Use UTC to avoid timezone issues

    if (isNaN(start.getTime())) throw new Error("Invalid start date");
    if (isNaN(end.getTime())) throw new Error("Invalid end date");
    if (end <= start) throw new Error("End date must be after start date");

    // --- CONFLICT CHECK ---
    const conflictingEvent = await EventsCollection.findOne({
      $or: [
        { name }, // Same name (even if dates differ)
        {
          $and: [
            { startDate: { $lt: end } },
            { endDate: { $gt: start } }
          ]
        }
      ]
    });

    if (conflictingEvent) {
      return res.status(409).json({
        success: false,
        error: `Event conflict: "${conflictingEvent.name}" (${conflictingEvent.startDate.toISOString()} - ${conflictingEvent.endDate.toISOString()})`
      });
    }

    // --- CREATE EVENT ---
    const totalDays = Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;

    const event = new EventsCollection({
      name,
      description,
      year,
      month,
      startDate: start,
      endDate: end,
      totalDays,
    });

    await event.save();

    // --- CREATE EVENT DAYS ---
    const eventDayDocs = Array.from({ length: totalDays }, (_, i) => {
      const dayDate = new Date(start);
      dayDate.setDate(dayDate.getDate() + i);

      return {
        event_ref: event._id,
        dayNumber: i + 1,
        name: `Day ${i + 1}`,
        description: description || `Day ${i + 1} description`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // await EventDayCollection.insertMany(eventDayDocs);
    await EventDayCollection.insertMany(eventDayDocs, { ordered: true, rawResult: true });

    // --- SUCCESS RESPONSE ---
    res.status(201).json({ success: true, eventId: event._id });

  } catch (error) {
    console.error("Event creation failed:", error.message);

    const statusCode = error.message.includes("Invalid") ? 400 :
                       error.message.includes("conflict") ? 409 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message
    });
  }
};

// development


export const updateEventDay = async (req, res) => {
    try {
        const { eventDayId } = req.params;
        const { name, description } = req.body;
        const eventDay = await EventDayCollection.findById(eventDayId);
        if (!eventDay) {
            return res.status(404).json({ message: "Event day not found" });
        }
        eventDay.name = name;
        eventDay.description = description;
        eventDay.updatedAt = new Date();

        await eventDay.save();
     
        res.status(201).json({ message: "Event day updated successfully" });
    } catch (error) {
        console.error("Error adding event day:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}

export const getEvent = async (req, res) => {
    try{
        const events = await EventsCollection.find();
        res.status(200).json(events);
    }
    catch(err){
        console.error("Couldn't get the event",err);
        res.status(500).json({ message: "Server error" });
    }
}
export const getTotalEvent = async (req, res) => {
  try {
    console.log("getTotalEvent called");
    // First check if there are any events
    const events = await EventsCollection.find();
    console.log("Events found:", events.length);
    
    if (!events || events.length === 0) {
      console.log("No events found, returning 404");
      return res.status(404).json({ message: "No events found" });
    }

    // Get the first event
    const event = events[0];
    
    // Get time entries for this event
    const timeEntries = await TimeCollection.find({ event_ref: event._id })
      .populate('day_ref')
      .populate('event_ref');
    
    // Get event days for this event
    const eventDays = await EventDayCollection.find({ event_ref: event._id });
    
    const daysMap = new Map();
    
    // Initialize days with empty times array
    eventDays.forEach(day => {
      const dayObj = day.toObject();
      dayObj.times = [];
      daysMap.set(day._id.toString(), dayObj);
    });
    
    // Add time entries to their respective days
    timeEntries.forEach(entry => {
      if (!entry.day_ref) return;
      
      const dayId = entry.day_ref._id.toString();
      
      if (daysMap.has(dayId)) {
        const timeEntry = entry.toObject();
        delete timeEntry.event_ref;
        delete timeEntry.day_ref;
        daysMap.get(dayId).times.push(timeEntry);
      }
    });
    
    const days = Array.from(daysMap.values());
    days.sort((a, b) => a.dayNumber - b.dayNumber);
    
    days.forEach(day => {
      day.times.sort((a, b) => {
        const timeA = a.startTime ? new Date(`1970-01-01T${a.startTime}`) : 0;
        const timeB = b.startTime ? new Date(`1970-01-01T${b.startTime}`) : 0;
        return timeA - timeB;
      });
    });
    
    const response = {
      event: event.toObject(),
      days: days
    };
    
    res.json(response);
     
  } catch (error) {
    console.error("Error in getTotalEvent:", error);
    res.status(500).json({ message: error.message });
  }
}
export const getEventDay = async (req, res) => {
    try {
        
        const eventDay = await EventDayCollection.find();
        if (!eventDay || eventDay.length === 0) {
            return res.status(404).json({ message: "Event day not found" });
        }
        res.status(200).json(eventDay);
    } catch (error) {
        console.error("Error fetching event day:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}
export const addTime = async (req, res) => {
    try {
        const{eventId} = req.params;
        const { eventDay_ref } = req.params;
        const { startTime, endTime,title,description,type,speaker } = req.body;
         const toMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const newStart = toMinutes(startTime);
        const newEnd = toMinutes(endTime);

        // Validate time format
        if (isNaN(newStart) || isNaN(newEnd)) {
            return res.status(400).json({ message: "Invalid time format (use HH:MM)" });
        }

        // Check if end time is after start time
        if (newEnd <= newStart) {
            return res.status(400).json({ message: "End time must be after start time" });
        }
      // Check for conflicting times
        const existingTimes = await TimeCollection.find({ 
             day_ref: eventDay_ref,
            event_ref: eventId,
         
        });

        const hasConflict = existingTimes.some(existing => {
            const existingStart = toMinutes(existing.startTime);
            const existingEnd = toMinutes(existing.endTime);
            
            return (
                (newStart >= existingStart && newStart < existingEnd) ||
                (newEnd > existingStart && newEnd <= existingEnd) ||
                (newStart <= existingStart && newEnd >= existingEnd)
            );
        });

        if (hasConflict) {
            return res.status(409).json({ 
                message: "Time slot conflicts with an existing event",
                suggestion: "Please choose a different time slot"
            });
        }
        const time = new TimeCollection({
            day_ref:eventDay_ref,
            event_ref:eventId,
            startTime,
            endTime,
            title,
            description,
            type,
            speaker
        });
        await time.save();
        res.status(200).json({ message: "Time added successfully" });
    } catch (error) {
        console.error("Error adding time:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}

export const updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { name, description ,year,month,startDate,endDate } = req.body;
           const start = new Date(startDate);
            const end = new Date(endDate);
         if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        if (end < start) {
            return res.status(400).json({ message: "End date must be after start date" });
        }

      
        const actualYear = start.getFullYear();
        const actualMonth = start.getMonth() + 1; 

         const totalDays = Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
        const event = await EventsCollection.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        event.name = name;
        event.description = description;
        event.year = year;
        event.month = month;
        event.startDate = startDate;
        event.endDate = endDate;
        event.totalDays = totalDays;
        event.updatedAt = new Date();

        await event.save();
        
        // Delete existing event days and their associated time slots
        const existingEventDays = await EventDayCollection.find({ event_ref: event._id });
        const existingDayIds = existingEventDays.map(day => day._id);
        
        // Delete associated time slots first
        if (existingDayIds.length > 0) {
            await TimeCollection.deleteMany({ day_ref: { $in: existingDayIds } });
        }
        
        // Delete existing event days
        await EventDayCollection.deleteMany({ event_ref: event._id });
        
        // Create new event days
        const eventDayDocs = [];
        for (let i = 0; i < totalDays; i++) {
            const dayDate = new Date(startDate);
            dayDate.setDate(dayDate.getDate() + i);
            eventDayDocs.push({
                event_ref: event._id,
                dayNumber: i + 1,
                name: `Day ${i + 1}`,
                description: `Day ${i + 1} description`,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        await EventDayCollection.insertMany(eventDayDocs);
         
     
        res.status(201).json({ message: "Event updated successfully" });
    } catch (error) {
        console.error("Error updating event:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}
export const updateTime = async (req, res) => {
    try {
        const { timeId } = req.params;
        const {day_ref} = req.params;
        const { startTime, endTime,title,description,type,speaker } = req.body;
       const toMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const newStart = toMinutes(startTime);
        const newEnd = toMinutes(endTime);

        // Validate time format
        if (isNaN(newStart) || isNaN(newEnd)) {
            return res.status(400).json({ message: "Invalid time format (use HH:MM)" });
        }

        // Check if end time is after start time
        if (newEnd <= newStart) {
            return res.status(400).json({ message: "End time must be after start time" });
        }
      // Check for conflicting times
        const existingTimes = await TimeCollection.find({ 
             day_ref: day_ref,
            _id: { $ne: timeId }
         
        });

        const hasConflict = existingTimes.some(existing => {
            const existingStart = toMinutes(existing.startTime);
            const existingEnd = toMinutes(existing.endTime);
            
            return (
                (newStart >= existingStart && newStart < existingEnd) ||
                (newEnd > existingStart && newEnd <= existingEnd) ||
                (newStart <= existingStart && newEnd >= existingEnd)
            );
        });

        if (hasConflict) {
            return res.status(409).json({ 
                message: "Time slot conflicts with an existing event",
                suggestion: "Please choose a different time slot"
            });
        }
        const time = await TimeCollection.findById(timeId);
        if (!time) {
            return res.status(404).json({ message: "Time not found" });
        }
        time.startTime = startTime;
        time.endTime = endTime;
        time.title = title;
        time.description = description;
        time.type = type;
        time.speaker = speaker;
        time.updatedAt = new Date();

        await time.save();
        res.status(201).json({ message: "Time updated successfully" });
    } catch (error) {
        console.error("Error updating time:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}

export const deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;

      
        const eventDays = await EventDayCollection.find({ event_ref: eventId });

        
        const eventDayIds = eventDays.map(day => day._id);

    
        await TimeCollection.deleteMany({ day_ref: { $in: eventDayIds } });

    
        await EventDayCollection.deleteMany({ event_ref: eventId });

   
        await EventsCollection.findByIdAndDelete(eventId);

        res.status(200).json({
            message: "Event and all associated data deleted successfully",
            deletedEvent: eventId,
            deletedEventDays: eventDays.length,
            deletedTimeEntries: eventDayIds.length,
        });

    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ 
            message: "Server error",
            error: error.message 
        });
    }
};

export const genratePdf = async(req,res)=>{
     try {
    const timeEntries = await TimeCollection.find()
      .populate('day_ref')
      .populate('event_ref');
    
    if (timeEntries.length === 0) {
      return res.status(404).json({ message: "No time entries found" });
    }

    const eventData = timeEntries[0].event_ref.toObject();
    const daysMap = new Map();
    
    timeEntries.forEach(entry => {
      const dayId = entry.day_ref._id.toString();
      if (!daysMap.has(dayId)) {
        const day = entry.day_ref.toObject();
        day.times = [];
        daysMap.set(dayId, day);
      }
      daysMap.get(dayId).times.push(entry.toObject());
    });

    const response = {
      event: eventData,
      days: Array.from(daysMap.values())
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${response.event.name}_schedule.pdf`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Handle stream errors
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Failed to generate PDF' });
      }
    });

    doc.pipe(res);

    // Header
    doc.font('Helvetica-Bold').fontSize(24).text(response.event.name, { align: 'center' });
    doc.fontSize(12).text(`${response.event.year}/${response.event.month}`, { 
      align: 'center', 
      marginBottom: 30 
    });

    // Draw each day
    let yPosition = 100; // Starting Y-coordinate after header
    
    response.days.forEach(day => {
      // Check if we need a new page
      if (yPosition > 700) { // Approximate bottom margin
        doc.addPage();
        yPosition = 50;
      }

      // Day Header
      doc.font('Helvetica-Bold').fontSize(16)
        .text(`Day ${day.dayNumber}`, 50, yPosition, { continued: true });
      doc.font('Helvetica').fontSize(12)
        .text(` - ${day.name}`, { x: 120, y: yPosition });
      yPosition += 25;

      // Table Headers
      doc.font('Helvetica-Bold').text('Time', 50, yPosition);
      doc.text('Event Name', 150, yPosition);
      doc.text('Description', 300, yPosition);
      yPosition += 20;

      // Timetable Rows
      day.times.forEach(time => {
        // Check if we need a new page before adding a new row
        if (yPosition > 750) {
          doc.addPage();
          yPosition = 50;
          // Redraw headers on new page
          doc.font('Helvetica-Bold').text('Time', 50, yPosition);
          doc.text('Event Name', 150, yPosition);
          doc.text('Description', 300, yPosition);
          yPosition += 20;
        }

        // const startTime = DateTime.fromISO(time.startTime).toFormat('HH:mm');
        doc.font('Helvetica').text(time.startTime, 50, yPosition);
        doc.text(time.title, 150, yPosition);
        doc.text(time.description, 300, yPosition);
        yPosition += 20;
      });

      yPosition += 20; // Space between days
    });

    doc.end();
  } catch (err) {
    console.error('Error in generatePdf:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Failed to generate PDF', 
        error: err.message 
      });
    }
  }
}

export const deleteTime = async (req, res) =>{
  try{
    const { timeId } = req.params;
    const time = await TimeCollection.findByIdAndDelete(timeId);
    if(!time){
      return res.status(404).json({ message: 'Time not found' });
    }
    res.status(200).json({ message: 'Time deleted successfully' });

  }
  catch(err){
    console.error('Error in deleteTime:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
export const getTime = async (req, res) =>{
  try{
    const time = await TimeCollection.find();
    if(!time || time.length === 0){
      return res.status(404).json({ message: 'Time not found' });
    }
    res.status(200).json(time);
  }
  catch(err){
    console.error('Error in getTime:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

export const getFullEventDetails = async (req, res) => {
  try {
  

    const events  = await EventsCollection.find();
    if (!events || events.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = events[0];
    
    const eventDays = await EventDayCollection.find({ event_ref: event._id });
    const timeSlots = await TimeCollection.find({ event_ref: event._id }).populate("day_ref");
   const structuredDays = eventDays.map(day => {
      return {
        ...day.toObject(),
        timeSlots: timeSlots.filter(slot => slot.day_ref._id.toString() === day._id.toString())
      };
    });

    res.status(200).json({
      event,
      days: structuredDays
    });
  } catch (err) {
    console.error("Error fetching full event details:", err);
    res.status(500).json({ message: "Server error" });
  }
};

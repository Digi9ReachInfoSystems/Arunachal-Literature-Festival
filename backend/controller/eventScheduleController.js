import { EventDayCollection, EventsCollection,TimeCollection } from "../models/eventModel.js";
import PDFDocument from 'pdfkit'; // Assuming pdfdoc is PDFKit
import { DateTime } from 'luxon'; 

export const addEvent = async (req, res) => {
    try {
        const { name, description, year, month, startDate, endDate } =
            req.body;
              const start = new Date(startDate);
                const end = new Date(endDate);
         if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        if (end < start) {
            return res.status(400).json({ message: "End date must be after start date" });
        }



        // Check for duplicate events
        const existingEvent = await EventsCollection.findOne({
            name,
            startDate: start,
            endDate: end
        });

        if (existingEvent) {
            return res.status(409).json({ message: "Event with same name and dates already exists" });
        }
           const existing = await EventsCollection.find();
                    if (existing.length > 0) {
                      return res.status(400).json({ message: "Cant add event untill is ends" });
                    }
        

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
            })
            
        }
        await EventDayCollection.insertMany(eventDayDocs);

        res.status(200).json({ message: "Event added successfully" });
    } catch (error) {
        console.error("Error adding event:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}

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

        eventDay.save();
     
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
        console.error("coudnlt get the event",err);
        res.status(500).json({ message: "Server error" });
    }
}
export const getTotalEvent = async (req,res)=>{
      try {
    // First get all time entries with populated references
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
      
   
      const timeEntry = entry.toObject();
      delete timeEntry.event_ref;
      delete timeEntry.day_ref;
      
      daysMap.get(dayId).times.push(timeEntry);
    });
    
    
    const days = Array.from(daysMap.values());
    

    days.sort((a, b) => a.dayNumber - b.dayNumber);
    
 
    days.forEach(day => {
      day.times.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    });
    
    
    const response = {
      event: eventData,
      days: days
    };
    
    res.json(response);
     
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
export const getEventDay = async (req, res) => {
    try {
        
        const eventDay = await EventDayCollection.find();
        if (!eventDay) {
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

        event.save();
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
            })
            
        }
        await EventDayCollection.insertMany(eventDayDocs)
         
     
        res.status(201).json({ message: "Event updated successfully" });
    } catch (error) {
        console.error("Error updating event day:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}
export const updateTime = async (req, res) => {
    try {
        const { timeId } = req.params;
        const { startTime, endTime,title,description,type,speaker } = req.body;
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

        time.save();
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

// export const getDayEven

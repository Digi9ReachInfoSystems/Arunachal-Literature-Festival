
import { EventsCollection } from "../../models/eventModel.js";
import { updateEvent } from '../eventScheduleController';


// Import necessary modules and functions
// Mock the database collections
jest.mock("../../models/eventModel.js", () => ({
  EventDayCollection: {
    insertMany: jest.fn(),
  },
  EventsCollection: {
    findById: jest.fn(),
  },
}));

describe('updateEvent() updateEvent method', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      params: { eventId: '123' },
      body: {
        name: 'Updated Event',
        description: 'Updated Description',
        year: 2023,
        month: 10,
        startDate: '2023-10-01',
        endDate: '2023-10-05',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('Happy Paths', () => {
    it('should update an event successfully', async () => {
      // Mock the database response for finding an event
      EventsCollection.findById.mockResolvedValue({
        _id: '123',
        save: jest.fn(),
      });

      // Call the updateEvent function
      await updateEvent(req, res);

      // Assertions
      expect(EventsCollection.findById).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Event updated successfully' });
    });
  });

  describe('Edge Cases', () => {
    it('should return 400 if startDate or endDate is invalid', async () => {
      req.body.startDate = 'invalid-date';
      req.body.endDate = 'invalid-date';

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid date format' });
    });

    it('should return 400 if endDate is before startDate', async () => {
      req.body.startDate = '2023-10-05';
      req.body.endDate = '2023-10-01';

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'End date must be after start date' });
    });

    it('should return 404 if event is not found', async () => {
      EventsCollection.findById.mockResolvedValue(null);

      await updateEvent(req, res);

      expect(EventsCollection.findById).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Event not found' });
    });

    it('should return 500 on server error', async () => {
      EventsCollection.findById.mockRejectedValue(new Error('Database error'));

      await updateEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
});
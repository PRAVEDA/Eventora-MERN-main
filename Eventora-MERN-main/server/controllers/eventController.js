const mongoose = require('mongoose');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

exports.getEvents = async (req, res) => {
    try {
        const filters = {};
        if (req.query.category && req.query.category.trim() !== '' && req.query.category !== 'All') {
            filters.category = req.query.category.trim();
        }
        if (req.query.search && req.query.search.trim() !== '') {
            filters.title = { $regex: req.query.search.trim(), $options: 'i' };
        }

        const events = await Event.find(filters)
            .populate('createdBy', 'name email')
            .sort({ date: 1 }); // Sort by upcoming dates first

        return res.json(events);
    } catch (error) {
        console.error('getEvents error:', error);
        return res.status(500).json({ message: 'Server error retrieving events', error: error.message });
    }
};

exports.getEventById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid event ID format' });
        }

        const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        return res.json(event);
    } catch (error) {
        console.error('getEventById error:', error);
        return res.status(500).json({ message: 'Server error retrieving event details', error: error.message });
    }
};

exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location, category, totalSeats, ticketPrice, image } = req.body;

        if (!title || !description || !date || !location || !category || totalSeats === undefined || totalSeats === null) {
            return res.status(400).json({ message: 'All required fields (title, description, date, location, category, totalSeats) must be provided.' });
        }

        const parsedTotalSeats = parseInt(totalSeats, 10);
        if (isNaN(parsedTotalSeats) || parsedTotalSeats <= 0) {
            return res.status(400).json({ message: 'Total seats must be a positive integer' });
        }

        const parsedTicketPrice = parseFloat(ticketPrice);
        if (isNaN(parsedTicketPrice) || parsedTicketPrice < 0) {
            return res.status(400).json({ message: 'Ticket price cannot be negative' });
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: 'A valid event date is required' });
        }

        const event = await Event.create({
            title: title.trim(),
            description: description.trim(),
            date: parsedDate,
            location: location.trim(),
            category: category.trim(),
            totalSeats: parsedTotalSeats,
            availableSeats: parsedTotalSeats,
            ticketPrice: parsedTicketPrice,
            image: image ? image.trim() : '',
            createdBy: req.user.id
        });

        return res.status(201).json(event);
    } catch (error) {
        console.error('createEvent error:', error);
        return res.status(500).json({ message: 'Server error creating event', error: error.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid event ID format' });
        }

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const { title, description, date, location, category, totalSeats, ticketPrice, image } = req.body;

        if (title !== undefined) event.title = title.trim();
        if (description !== undefined) event.description = description.trim();
        if (location !== undefined) event.location = location.trim();
        if (category !== undefined) event.category = category.trim();
        if (image !== undefined) event.image = image.trim();

        if (date !== undefined) {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ message: 'Invalid date format' });
            }
            event.date = parsedDate;
        }

        if (ticketPrice !== undefined) {
            const parsedPrice = parseFloat(ticketPrice);
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                return res.status(400).json({ message: 'Ticket price cannot be negative' });
            }
            event.ticketPrice = parsedPrice;
        }

        if (totalSeats !== undefined) {
            const parsedSeats = parseInt(totalSeats, 10);
            if (isNaN(parsedSeats) || parsedSeats <= 0) {
                return res.status(400).json({ message: 'Total seats must be a positive integer' });
            }
            const bookedSeats = event.totalSeats - event.availableSeats;
            event.totalSeats = parsedSeats;
            event.availableSeats = Math.max(0, parsedSeats - bookedSeats);
        }

        await event.save();
        return res.json(event);
    } catch (error) {
        console.error('updateEvent error:', error);
        return res.status(500).json({ message: 'Server error updating event', error: error.message });
    }
};

exports.deleteEvent = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid event ID format' });
        }

        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Cancel pending bookings for this deleted event
        await Booking.updateMany(
            { eventId: req.params.id, status: 'pending' },
            { status: 'cancelled' }
        );

        return res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('deleteEvent error:', error);
        return res.status(500).json({ message: 'Server error deleting event', error: error.message });
    }
};

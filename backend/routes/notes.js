const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/authentication');
const { csrfProtection } = require('../middleware/csrfProtection');

// Apply CSRF protection to all routes
router.use(csrfProtection);

// Add this route before other routes
router.get('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOne({ 
            _id: req.params.id,
            user_id: req.user.id 
        });
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.json(note);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all notes for a user
router.get('/', auth, async (req, res) => {
    try {
        const notes = await Note.find({ user_id: req.user.id });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new note
router.post('/', auth, async (req, res) => {
    try {
        if (!req.body.title || !req.body.content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        // Add logging to debug
        console.log('User ID from token:', req.user.id);
        
        const note = new Note({
            user_id: req.user.id,
            title: req.body.title,
            content: req.body.content,
            created_at: Date.now(),
            last_edited: Date.now()
        });

        console.log('Note before save:', note);

        const newNote = await note.save();
        res.status(201).json(newNote);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(400).json({ message: error.message });
    }
});

// Delete a note
router.delete('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ 
            _id: req.params.id,
            user_id: req.user.id 
        });
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a note
router.put('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user.id },
            { 
                title: req.body.title,
                content: req.body.content,
                last_edited: Date.now()
            },
            { new: true }
        );
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.json(note);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

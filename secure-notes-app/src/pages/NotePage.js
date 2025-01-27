import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Form, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const NotePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [note, setNote] = useState({
        title: '',
        content: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [csrfToken, setCsrfToken] = useState('');

    const isNewNote = id === 'new';

    useEffect(() => {
        // Fetch CSRF token when component mounts
        const fetchCsrfToken = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/auth/csrf-token', {
                    credentials: 'include'
                });
                const data = await response.json();
                setCsrfToken(data.csrfToken);
            } catch (error) {
                console.error('Error fetching CSRF token:', error);
                setError('Failed to initialize security features');
            }
        };

        fetchCsrfToken();
        if (!isNewNote) {
            fetchNote();
        } else {
            setLoading(false);
        }
    }, [id]);

    const fetchNote = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/api/notes/${id}`, {
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-CSRF-Token': csrfToken
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch note');
            }
            
            const data = await response.json();
            setNote(data);
        } catch (error) {
            console.error('Error fetching note:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = isNewNote 
                ? 'http://localhost:5000/api/notes'
                : `http://localhost:5000/api/notes/${id}`;
            
            const method = isNewNote ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    title: note.title,
                    content: note.content
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save note');
            }
            
            navigate('/dashboard');
        } catch (error) {
            console.error('Error saving note:', error);
            setError(error.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNote(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) {
        return <Container className="mt-5"><h2>Loading...</h2></Container>;
    }

    if (error) {
        return (
            <Container className="mt-5">
                <h2>Error: {error}</h2>
                <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <Button 
                    variant="outline-secondary"
                    onClick={() => navigate('/dashboard')}
                    className="d-flex align-items-center"
                >
                    <i className="fas fa-arrow-left me-2"></i>
                    Back to Dashboard
                </Button>
                <h1 className="m-0">{isNewNote ? 'Create New Note' : 'Edit Note'}</h1>
                <div style={{width: '138px'}}></div>
            </div>
            
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                        type="text"
                        name="title"
                        value={note.title}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Content</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={10}
                        name="content"
                        value={note.content}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>
                <div className="d-flex gap-2">
                    <Button variant="primary" type="submit">
                        Save
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                        Cancel
                    </Button>
                </div>
            </Form>
        </Container>
    );
};

export default NotePage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import NoteCard from '../components/NoteCard';
import './DashboardPage.css'; // Assuming you have some additional CSS for styling
import { Navbar, Nav, NavDropdown, Button, Container } from 'react-bootstrap';

const DashboardPage = () => {
    const { isAuthenticated, logout, token, user } = useAuth();
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [csrfToken, setCsrfToken] = useState('');

    const fetchNotes = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/notes', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setNotes(data);
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    useEffect(() => {
        const fetchCsrfToken = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/auth/csrf-token', {
                    credentials: 'include'
                });
                const data = await response.json();
                setCsrfToken(data.csrfToken);
            } catch (error) {
                console.error('Error fetching CSRF token:', error);
            }
        };

        if (isAuthenticated) {
            fetchCsrfToken();
            fetchNotes();
        } else {
            navigate('/login');
        }
    }, [isAuthenticated, navigate, token]);

    const handleCreateNewNote = () => {
        navigate('/note/new');
    };

    const handleDelete = async (noteId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-CSRF-Token': csrfToken
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete note');
            }

            setNotes(notes.filter(note => note._id !== noteId));
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-CSRF-Token': csrfToken
                }
            });

            if (!response.ok) {
                throw new Error('Logout failed');
            }

            logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <>
            <Navbar expand="lg" className="dashboard-navbar">
                <Container fluid>
                    <Navbar.Brand className="nav-brand">Secure Notes App</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Button 
                                onClick={handleCreateNewNote}
                                className="new-note-btn rounded-pill mx-2"
                            >
                                <i className="fas fa-plus me-2"></i>New Note
                            </Button>
                        </Nav>
                        <Nav>
                            <NavDropdown 
                                title={
                                    <span className="text-white">
                                        <i className="fas fa-user-circle me-2"></i>
                                        {user?.name || 'User'}
                                    </span>
                                } 
                                id="basic-nav-dropdown"
                            >
                                <NavDropdown.Item onClick={handleLogout}>
                                    <i className="fas fa-sign-out-alt me-2"></i>Logout
                                </NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            
            <Container className="notes-container">
                <h1 className="page-title">Your Notes</h1>
                <div className="row notes-grid">
                    {notes.length > 0 ? (
                        notes.map(note => (
                            <div key={note._id} className="col-md-4 col-lg-3">
                                <NoteCard 
                                    id={note._id}
                                    title={note.title}
                                    content={note.content}
                                    onDelete={handleDelete}
                                    lastEdited={note.updatedAt}
                                />
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <i className="fas fa-notebook mb-3 fs-1"></i>
                            <h3>No notes yet</h3>
                            <p>Create your first note to get started!</p>
                        </div>
                    )}
                </div>
            </Container>
        </>
    );
};

export default DashboardPage;

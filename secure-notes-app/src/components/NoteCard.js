import React from 'react';
import PropTypes from 'prop-types';
import { Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import './NoteCard.css'; // Assuming you have some additional CSS for styling

const NoteCard = ({ id, title, content, onDelete, lastEdited }) => {
    const navigate = useNavigate();
    
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Card className="mb-3">
            <Card.Body>
                <Card.Title>{title}</Card.Title>
                <Card.Text>{content.substring(0, 100)}...</Card.Text>
                <small className="text-muted mb-2 d-block">
                    Last edited: {formatDate(lastEdited)}
                </small>
                <div className="d-flex justify-content-between">
                    <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => navigate(`/note/${id}`)}
                    >
                        Edit
                    </Button>
                    <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => onDelete(id)}
                    >
                        Delete
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

NoteCard.propTypes = {
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    onDelete: PropTypes.func.isRequired,
    lastEdited: PropTypes.string.isRequired,
};

export default NoteCard;
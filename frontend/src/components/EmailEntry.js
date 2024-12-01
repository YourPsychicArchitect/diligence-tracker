import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';

function EmailEntry({ onEmailSubmit }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    onEmailSubmit(email);
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4, 
        borderRadius: 2,
        backgroundColor: 'background.paper' 
      }}
    >
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 3 
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          align="center"
        >
          Diligence Tracker
        </Typography>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!error}
          helperText={error}
          required
          fullWidth
          autoFocus
          sx={{ mb: 1 }}
        />
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          size="large"
          sx={{ 
            py: 1.5,
            '&:hover': {
              transform: 'translateY(-1px)',
            },
            transition: 'transform 0.2s',
          }}
        >
          Start Tracking
        </Button>
      </Box>
    </Paper>
  );
}

export default EmailEntry;
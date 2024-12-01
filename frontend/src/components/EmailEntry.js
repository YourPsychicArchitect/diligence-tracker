import React, { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';

function EmailEntry({ onEmailSubmit }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onEmailSubmit(email);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Enter Your Email
      </Typography>
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" variant="contained" color="primary">
        Start Tracking
      </Button>
    </Box>
  );
}

export default EmailEntry;
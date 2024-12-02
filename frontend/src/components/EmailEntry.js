import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import { Help as HelpIcon } from '@mui/icons-material';
import HelpDialog from './HelpDialog';

function EmailEntry({ onEmailSubmit }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      setError('Email is required');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    onEmailSubmit(email);
  };

  return (
    <>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          width: '100%',
          maxWidth: 400,
          position: 'relative'
        }}
      >
        <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Tooltip title="Help">
            <IconButton onClick={() => setShowHelp(true)}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Diligence Tracker
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            error={!!error}
            helperText={error}
            margin="normal"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 2 }}
          >
            Start Tracking
          </Button>
        </form>
      </Paper>

      <HelpDialog 
        open={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </>
  );
}

export default EmailEntry;
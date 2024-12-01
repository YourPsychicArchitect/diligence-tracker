import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container } from '@mui/material';
import theme from './theme';
import EmailEntry from './components/EmailEntry';
import DiligenceTracker from './components/DiligenceTracker';

function App() {
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (submittedEmail) => {
    setEmail(submittedEmail);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Container component="main" maxWidth="sm" sx={{ mt: 4, mb: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {email ? (
            <DiligenceTracker email={email} onLogout={() => setEmail('')} />
          ) : (
            <EmailEntry onEmailSubmit={handleEmailSubmit} />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
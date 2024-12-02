import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Help as HelpIcon } from '@mui/icons-material';

function HelpDialog({ open, onClose }) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <HelpIcon color="primary" />
          <Typography variant="h6">Diligence Tracker Guide</Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ 
              color: 'text.primary',
              backgroundColor: 'primary.main',
              px: 2,
              py: 1,
              borderRadius: 1,
              mb: 2
            }} gutterBottom>
            Why Use Diligence Tracker?
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Build Consistent Habits"
                secondary="Track activities that benefit from frequent, regular practice throughout the day, like meditation, reality checks for lucid dreaming, or self-improvement exercises."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Visual Progress Tracking"
                secondary="See your daily activity patterns through an intuitive hourly chart, helping you identify peak times and maintain regular practice."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Long-term Data Analysis"
                secondary="Access detailed statistics and trends over time to understand your practice patterns and improvements."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Data Ownership"
                secondary="All your data is stored in your personal Google Spreadsheet, which you can access, download, or analyze anytime."
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ 
              color: 'text.primary',
              backgroundColor: 'primary.main',
              px: 2,
              py: 1,
              borderRadius: 1,
              mb: 2
            }} gutterBottom>
            Getting Started
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="1. Create or Select a Task"
                secondary="Use the dropdown menu to select an existing task or create a new one. Each task is limited to 31 characters and tracks a specific activity you want to practice regularly."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="2. Record Your Practice"
                secondary='Click the "I did it!" button each time you complete your chosen activity. This helps maintain awareness and build consistency throughout the day.'
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="3. Monitor Your Progress"
                secondary="The hourly chart shows today's activity patterns, while the statistics section provides daily, weekly, and monthly summaries."
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ 
              color: 'text.primary',
              backgroundColor: 'primary.main',
              px: 2,
              py: 1,
              borderRadius: 1,
              mb: 2
            }} gutterBottom>
            Your Data in Google Sheets
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Automatic Data Storage"
                secondary="Every time you click 'I did it!', an entry is automatically recorded in your personal Google Spreadsheet with precise timestamps."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Access Your Data"
                secondary='Click the "View Spreadsheet" link at the bottom of the page to access your complete data history. Each task has its own sheet within the spreadsheet.'
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Data Security"
                secondary="Your spreadsheet is private and only accessible to you and the app creator joshua@yourpsychicarchitect.com (for support purposes). You can download, analyze, or share your data as needed."
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" sx={{ 
              color: 'text.primary',
              backgroundColor: 'primary.main',
              px: 2,
              py: 1,
              borderRadius: 1,
              mb: 2
            }} gutterBottom>
            Tips for Success
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Regular Check-ins"
                secondary="Set regular times to practice your activity, but also stay flexible for spontaneous practice sessions."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Multiple Tasks"
                secondary="You can track different activities separately by creating multiple tasks. Each task maintains its own history and statistics."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Review Your Patterns"
                secondary="Use the hourly chart to identify your most and least active times, helping you maintain better consistency throughout the day."
              />
            </ListItem>
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default HelpDialog;
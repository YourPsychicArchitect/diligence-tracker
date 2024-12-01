import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Select, MenuItem, IconButton, AppBar, Toolbar, Tooltip, Link } from '@mui/material';
import { Edit as EditIcon, Check as CheckIcon, ExitToApp as LogoutIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../config';
import HourlyActivityChart from './HourlyActivityChart';
import SummaryStatistics from './SummaryStatistics';
import { styled } from '@mui/material/styles';

const StyledLink = styled(Link)(({ theme }) => ({
  color: theme.palette.common.white,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

function DiligenceTracker({ email, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const hourlyChartRef = React.useRef();
  const summaryStatsRef = React.useRef();

  useEffect(() => {
    fetchTasks();
    fetchSpreadsheetUrl();
  }, [email]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        if (data.tasks.length > 0) {
          setSelectedTask(data.tasks[0]);
        }
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchSpreadsheetUrl = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/spreadsheet_url?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setSpreadsheetUrl(data.url);
      } else {
        throw new Error('Failed to fetch spreadsheet URL');
      }
    } catch (error) {
      console.error('Error fetching spreadsheet URL:', error);
    }
  };

  const handleDidIt = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, task: selectedTask }),
      });
      if (!response.ok) {
        throw new Error('Failed to record entry');
      }
      
      // Refresh all data after successful entry
      if (hourlyChartRef.current?.refreshData) {
        hourlyChartRef.current.refreshData();
      }
      if (summaryStatsRef.current?.refreshData) {
        summaryStatsRef.current.refreshData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleTaskChange = (event) => {
    setSelectedTask(event.target.value);
  };

  const handleEditTask = () => {
    setNewTaskName(selectedTask);
    setIsEditingTask(true);
  };

  const handleSaveTask = async () => {
    if (newTaskName && newTaskName.length <= 31) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/update_task`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            old_task: selectedTask,
            new_task: newTaskName
          }),
        });
        if (response.ok) {
          setTasks(tasks.map(task => task === selectedTask ? newTaskName : task));
          setSelectedTask(newTaskName);
        } else {
          throw new Error('Failed to update task');
        }
      } catch (error) {
        console.error('Error updating task:', error);
      }
      setIsEditingTask(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Diligence Tracker
          </Typography>
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={onLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
        {isEditingTask ? (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              inputProps={{ maxLength: 31 }}
              sx={{ mr: 1 }}
            />
            <Tooltip title="Save task name">
              <IconButton onClick={handleSaveTask}>
                <CheckIcon />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Select value={selectedTask} onChange={handleTaskChange} sx={{ mr: 1 }}>
              {tasks.map((task) => (
                <MenuItem key={task} value={task}>{task}</MenuItem>
              ))}
            </Select>
            <Tooltip title="Edit task name">
              <IconButton onClick={handleEditTask}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleDidIt}
          sx={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            fontSize: '1.5rem',
            mb: 2,
            '&:hover': {
              transform: 'scale(1.05)',
            },
            transition: 'transform 0.2s',
          }}
        >
          I did it!
        </Button>

        <HourlyActivityChart 
          ref={hourlyChartRef}
          email={email} 
          task={selectedTask} 
        />
        
        <Box sx={{ p: 2, width: '100%' }}>
          <SummaryStatistics 
            ref={summaryStatsRef}
            email={email} 
            task={selectedTask} 
          />
        </Box>

        <Box sx={{ p: 2, textAlign: 'center' }}>
          {spreadsheetUrl && (
            <StyledLink href={spreadsheetUrl} target="_blank" rel="noopener noreferrer">
              View Spreadsheet
            </StyledLink>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default DiligenceTracker;
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Select, 
  MenuItem, 
  IconButton, 
  AppBar, 
  Toolbar, 
  Tooltip, 
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions 
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Check as CheckIcon, 
  ExitToApp as LogoutIcon, 
  Add as AddIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config';
import HourlyActivityChart from './HourlyActivityChart';
import SummaryStatistics from './SummaryStatistics';
import { styled } from '@mui/material/styles';
import TimezoneSelector from './TimezoneSelector';
import HelpDialog from './HelpDialog';


const StyledLink = styled(Link)(({ theme }) => ({
  color: theme.palette.common.white,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const NEW_TASK_VALUE = "__new_task__";

function DiligenceTracker({ email, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false);
  const [newTaskError, setNewTaskError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const hourlyChartRef = React.useRef();
  const summaryStatsRef = React.useRef();

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        if (data.tasks.length > 0 && !selectedTask) {
          setSelectedTask(data.tasks[0]);
        }
      } else {
        throw new Error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, [email, selectedTask]);

  const fetchSpreadsheetUrl = useCallback(async () => {
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
  }, [email]);

  useEffect(() => {
    fetchTasks();
    fetchSpreadsheetUrl();
  }, [fetchTasks, fetchSpreadsheetUrl]);

  const handleDidIt = async () => {
    if (!selectedTask) return;
    
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
    const value = event.target.value;
    if (value === NEW_TASK_VALUE) {
      setIsNewTaskDialogOpen(true);
    } else {
      setSelectedTask(value);
    }
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

  const handleNewTaskSubmit = async () => {
    if (!newTaskName) {
      setNewTaskError('Task name is required');
      return;
    }

    if (newTaskName.length > 31) {
      setNewTaskError('Task name must be 31 characters or less');
      return;
    }

    if (tasks.includes(newTaskName)) {
      setNewTaskError('Task name already exists');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/update_task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          old_task: newTaskName,
          new_task: newTaskName
        }),
      });

      if (response.ok) {
        setTasks([...tasks, newTaskName]);
        setSelectedTask(newTaskName);
        setIsNewTaskDialogOpen(false);
        setNewTaskName('');
        setNewTaskError('');
      } else {
        throw new Error('Failed to create new task');
      }
    } catch (error) {
      console.error('Error creating new task:', error);
      setNewTaskError('Failed to create new task');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Diligence Tracker
          </Typography>
          <Tooltip title="Help">
            <IconButton color="inherit" onClick={() => setShowHelp(true)}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
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
              error={newTaskName.length > 31}
              helperText={newTaskName.length > 31 ? 'Maximum 31 characters' : ''}
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
              <MenuItem value={NEW_TASK_VALUE}>
                <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                  <AddIcon sx={{ mr: 1 }} />
                  Add new task
                </Box>
              </MenuItem>
            </Select>
            <Tooltip title="Edit task name">
              <IconButton onClick={handleEditTask} disabled={!selectedTask}>
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
          disabled={!selectedTask}
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

        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <TimezoneSelector email={email} />
        </Box>

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

      <Dialog open={isNewTaskDialogOpen} onClose={() => {
        setIsNewTaskDialogOpen(false);
        setNewTaskName('');
        setNewTaskError('');
      }}>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Name"
            fullWidth
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            inputProps={{ maxLength: 31 }}
            error={!!newTaskError}
            helperText={newTaskError || 'Maximum 31 characters'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsNewTaskDialogOpen(false);
            setNewTaskName('');
            setNewTaskError('');
          }}>
            Cancel
          </Button>
          <Button onClick={handleNewTaskSubmit} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
      <HelpDialog 
        open={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </Box>
  );
}

export default DiligenceTracker;
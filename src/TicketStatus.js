import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, CircularProgress, Divider,
  Chip, Paper, Grid, useTheme, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

// 🔧 Hardcoded API URL here
const API_URL = 'https://caferiadbnode.glitch.me';
const COMPANY_NAME = 'Caferia';
const CONTACT_NUMBER = '+91-9876543210';

const formatTime = (timestamp) =>
  timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

const formatDuration = (start, end) => {
  if (!start || !end) return '-';
  const duration = Math.floor((new Date(end) - new Date(start)) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes}m ${seconds}s`;
};

const getCurrentStatus = (ts) => {
  if (ts.served) return '🍽️ Served';
  if (ts.ready) return '✅ Ready';
  if (ts.preparing) return '🛠️ Preparing';
  if (ts.onBoard) return '🟢 OnBoard';
  return '🕑 Waiting';
};

// Move filterOrders outside component to avoid eslint warning
const filterOrders = (allOrders, suffix, mob, ticketDate) => {
  const fullTicketId = suffix ? `${ticketDate}-${suffix}`.toLowerCase() : '';
  const qMobile = mob.trim().toLowerCase();

  return allOrders.filter(
    (order) =>
      order.ticketId.toLowerCase() === fullTicketId &&
      order.customer.mobile.toLowerCase() === qMobile
  );
};

const TicketStatus = () => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ticketSuffix, setTicketSuffix] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [newStatusAvailable, setNewStatusAvailable] = useState(false);
  const theme = useTheme();
  const { ticketId } = useParams();

  // To keep track of last statuses for polling comparison
  const lastStatusesRef = useRef({});

  const ticketDate = (() => {
    const today = new Date();
    return `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  })();

  useEffect(() => {
    if (ticketId) setTicketSuffix(ticketId);
  }, [ticketId]);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/api/orders`);
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleSearch = () => {
    setError('');

    if (!/^\d{10}$/.test(mobile.trim())) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    const matched = filterOrders(orders, ticketSuffix, mobile, ticketDate);

    if (matched.length > 0) {
      setFiltered(matched);
      setSubmitted(true);
      // Initialize lastStatusesRef on search
      const statuses = {};
      matched.forEach(order => {
        statuses[order._id] = order.statusTimestamps || {};
      });
      lastStatusesRef.current = statuses;
      setNewStatusAvailable(false);
    } else {
      setFiltered([]);
      setError('No matching records found. Please check your Ticket ID and Mobile Number.');
    }
  };

  const handleClear = () => {
    setTicketSuffix('');
    setMobile('');
    setFiltered([]);
    setSubmitted(false);
    setError('');
    setNewStatusAvailable(false);
    lastStatusesRef.current = {};
  };

  // Poll every 30 seconds to check for status updates if submitted
  useEffect(() => {
    if (!submitted) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/orders`);
        setOrders(data);

        const matched = filterOrders(data, ticketSuffix, mobile, ticketDate);

        if (matched.length === 0) {
          // No matching orders found on refresh
          setFiltered([]);
          setError('No matching records found on update.');
          setNewStatusAvailable(false);
          lastStatusesRef.current = {};
          return;
        }

        // Check if any status changed compared to lastStatusesRef
        let statusChanged = false;
        matched.forEach(order => {
          const prev = lastStatusesRef.current[order._id] || {};
          const curr = order.statusTimestamps || {};

          // Compare timestamps keys and values
          const keys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
          for (let key of keys) {
            if ((prev[key] || '') !== (curr[key] || '')) {
              statusChanged = true;
              break;
            }
          }
        });

        if (statusChanged) {
          setNewStatusAvailable(true);
          // Update filtered orders too so UI can update
          setFiltered(matched);
          // Update lastStatusesRef for next comparison
          const statuses = {};
          matched.forEach(order => {
            statuses[order._id] = order.statusTimestamps || {};
          });
          lastStatusesRef.current = statuses;
        }
      } catch (error) {
        console.error('Error polling orders:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [submitted, ticketSuffix, mobile, ticketDate]);

  return (
    <Box p={{ xs: 2, sm: 4 }} bgcolor={theme.palette.background.default} color={theme.palette.text.primary} minHeight="100vh">

      <Typography variant="h4" textAlign="center" fontWeight="bold" mb={1} color="primary">
        {COMPANY_NAME}
      </Typography>
      <Typography variant="subtitle1" textAlign="center" mb={3} color="text.secondary">
        Date: {new Date().toLocaleDateString()}
      </Typography>

      <Typography variant="h5" textAlign="center" fontWeight="bold" mb={2} color="primary.dark">
        Track Your Order
      </Typography>

      {/* MODAL: Mobile Number Confirmation */}
      <Dialog open={!submitted} disableEscapeKeyDown>
        <DialogTitle>Confirm Your Details</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ticket ID (Last 4 digits)"
                value={ticketSuffix}
                onChange={(e) => setTicketSuffix(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                size="small"
              />
            </Grid>
            {error && (
              <Grid item xs={12}>
                <Typography variant="body2" color="error">{error}</Typography>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClear} color="secondary" startIcon={<ClearIcon />}>Clear</Button>
          <Button onClick={handleSearch} variant="contained" startIcon={<SearchIcon />} disabled={loading}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Spinner */}
      {loading && (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Notification Badge for New Status */}
      {newStatusAvailable && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            bgcolor: 'secondary.main',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 2,
            cursor: 'pointer',
            boxShadow: 3,
            zIndex: 1300,
            userSelect: 'none',
          }}
          onClick={() => setNewStatusAvailable(false)}
          title="Click to dismiss notification"
        >
          🔔 New status update available! Click to refresh.
        </Box>
      )}

      {/* Orders Display */}
      {!loading && submitted && filtered.length > 0 && filtered.map(order => {
        const ts = order.statusTimestamps || {};
        const status = getCurrentStatus(ts);
        const totalTime = formatDuration(ts.onBoard, ts.served);

        const timelineSteps = [
          { label: '🟢 OnBoard', time: ts.onBoard },
          { label: '🛠️ Preparing', time: ts.preparing },
          { label: '✅ Ready', time: ts.ready },
          { label: '🍽️ Served', time: ts.served },
        ].filter(step => step.time);

        return (
          <Paper key={order._id} elevation={2} sx={{ p: 3, mb: 4, maxWidth: 720, mx: 'auto', borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              🎟️ {order.ticketId} - {order.customer.name}
            </Typography>
            <Chip label={status} color="primary" size="small" sx={{ my: 1 }} />
            <Typography variant="body2"><strong>Mobile:</strong> {order.customer.mobile}</Typography>
            <Typography variant="body2" mb={2}><strong>Total Time:</strong> {totalTime}</Typography>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ borderLeft: '3px solid #1976d2', pl: 2 }}>
              {timelineSteps.map((step, index) => (
                <Box key={index} mb={index < timelineSteps.length - 1 ? 2 : 0}>
                  <Typography variant="body2" fontWeight="medium">
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'middle' }} /> {formatTime(step.time)}
                  </Typography>
                  {index < timelineSteps.length - 1 && <Divider sx={{ mt: 1 }} />}
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            {status === '🍽️ Served' && (
              <Typography variant="body2" color="success.main" textAlign="center" fontWeight="medium" mb={1}>
                🎉 Thank you for your purchase!
              </Typography>
            )}

            <Typography variant="caption" display="block" textAlign="center" color="text.secondary">
              Please wait patiently while your food is being prepared.
            </Typography>
            <Typography variant="caption" display="block" textAlign="center" color="text.secondary" mb={1}>
              Estimated wait time: 15 to 30 minutes.
            </Typography>
            <Typography variant="caption" display="block" textAlign="center" color="text.secondary" fontWeight="bold">
              Contact: {CONTACT_NUMBER}
            </Typography>
          </Paper>
        );
      })}
    </Box>
  );
};

export default TicketStatus;

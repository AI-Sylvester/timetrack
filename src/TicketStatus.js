import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, CircularProgress, Divider,
  Chip, Paper, Grid, useTheme
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

const API_URL = 'https://caferiadbnode.glitch.me' || 'http://localhost:5000';

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

const TicketStatus = () => {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [ticketSuffix, setTicketSuffix] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const theme = useTheme();
  const { ticketId } = useParams();

  const ticketDate = (() => {
    const today = new Date();
    return `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  })();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/api/orders`);
        const today = new Date();
        const todayOrders = data.filter(order => {
          const createdAt = new Date(order.createdAt);
          return (
            createdAt.getFullYear() === today.getFullYear() &&
            createdAt.getMonth() === today.getMonth() &&
            createdAt.getDate() === today.getDate()
          );
        });
        setOrders(todayOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    if (ticketId && orders.length > 0) {
      setTicketSuffix(ticketId);
      const fullTicketId = `${ticketDate}-${ticketId}`.toLowerCase();
      const matched = orders.filter(order =>
        order.ticketId.toLowerCase() === fullTicketId
      );
      setFiltered(matched);
      setSubmitted(true);
    }
  }, [ticketId, orders, ticketDate]);

  const handleSearch = () => {
    setSubmitted(true);
    const fullTicketId = ticketSuffix ? `${ticketDate}-${ticketSuffix}` : '';
    const qTicket = fullTicketId.trim().toLowerCase();
    const qMobile = mobile.trim().toLowerCase();

    const matched = orders.filter(order =>
      (qTicket && order.ticketId.toLowerCase() === qTicket) ||
      (qMobile && order.customer.mobile.toLowerCase() === qMobile)
    );

    setFiltered(matched);
  };

  const handleClear = () => {
    setTicketSuffix('');
    setMobile('');
    setFiltered([]);
    setSubmitted(false);
  };

  return (
    <Box p={{ xs: 2, sm: 3 }} bgcolor={theme.palette.grey[50]} minHeight="100vh">
      <Typography variant="h5" textAlign="center" fontWeight="bold" mb={2} color="primary.dark">
        Order Track Report
      </Typography>

      <Paper elevation={1} sx={{ p: 2, maxWidth: 700, mx: 'auto', mb: 3, borderRadius: 2 }}>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              label="Ticket ID (Last 4 digits)"
              value={ticketSuffix}
              onChange={(e) => setTicketSuffix(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm="auto">
            <Typography textAlign="center" color="text.secondary" variant="body2" fontWeight="medium">OR</Typography>
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              label="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Submit
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClear}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" mt={1} display="block">
          Searching from today's records: <strong>{ticketDate}</strong>
        </Typography>
      </Paper>

      {loading ? (
        <Box textAlign="center"><CircularProgress /></Box>
      ) : (
        submitted && (
          filtered.length === 0 ? (
            <Typography textAlign="center" color="text.secondary">No matching records found.</Typography>
          ) : (
            filtered.map(order => {
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
                <Paper key={order._id} elevation={2} sx={{ p: 2, mb: 3, maxWidth: 700, mx: 'auto', borderRadius: 2 }}>
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
                </Paper>
              );
            })
          )
        )
      )}
    </Box>
  );
};

export default TicketStatus;

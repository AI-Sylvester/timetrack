import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  AccessTime,
  Restaurant,
  CheckCircle,
  DoneAll,
  CancelPresentation,
} from '@mui/icons-material';

const STATUS_FLOW = ['onBoard', 'preparing', 'ready', 'served'];
const STATUS_COLORS = {
  onBoard: '#1976d2',
  preparing: '#212121',
  ready: '#006994',
  served: '#2e7d32',
  canceled: '#d32f2f',
};

const STATUS_ICONS = {
  onBoard: <AccessTime />,
  preparing: <Restaurant />,
  ready: <CheckCircle />,
  served: <DoneAll />,
  canceled: <CancelPresentation />,
};

const OrderStatusTimeline = ({ order }) => {



  const getStatusTimestamp = (status) => {
    if (order.statusTimestamps && order.statusTimestamps[status]) {
      return new Date(order.statusTimestamps[status]);
    }
    if (status === 'onBoard') return new Date(order.createdAt);
    return null;
  };

  const steps = order.status === 'canceled' ? ['onBoard', 'canceled'] : STATUS_FLOW;
  const currentIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        mt: 2,
        pl: 2,
        position: 'relative',
      }}
    >
      {steps.map((step, idx) => {
        const isActive = step === order.status;
        const isCompleted = STATUS_FLOW.indexOf(step) < currentIndex;
        const isCanceled = step === 'canceled';
        const iconColor = isActive || isCompleted || isCanceled ? STATUS_COLORS[step] : '#ccc';

        const timestamp = getStatusTimestamp(step);
        const timeString = timestamp
          ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '-';

        return (
          <Box key={step} sx={{ display: 'flex', mb: idx < steps.length - 1 ? 3 : 0, position: 'relative' }}>
            {/* Circle Icon */}
            <Box
              sx={{
                backgroundColor: iconColor,
                color: '#fff',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
                position: 'relative',
              }}
            >
              {React.cloneElement(STATUS_ICONS[step], {
                fontSize: 'small',
              })}
            </Box>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 28,
                  left: 13,
                  width: 2,
                  height: 32,
                  backgroundColor:
                    STATUS_FLOW.indexOf(steps[idx + 1]) <= currentIndex
                      ? STATUS_COLORS[order.status]
                      : '#ccc',
                  zIndex: 0,
                }}
              />
            )}

            {/* Label & Time */}
            <Box sx={{ ml: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isActive ? 600 : 400,
                  textTransform: 'capitalize',
                  color: isActive
                    ? STATUS_COLORS[step]
                    : isCompleted || isCanceled
                    ? '#444'
                    : '#999',
                }}
              >
                {step}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                {timeString}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default OrderStatusTimeline;

import { Helmet } from "react-helmet-async";
// @mui
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  FormControl,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  InputLabel,
  Snackbar,
  Alert,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

// ----------------------------------------------------------------------

// Define the schema for a reminder
const ReminderSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  dateTime: z.date(),
});

type ReminderType = z.infer<typeof ReminderSchema>;

// Mock data
const mockReminders: ReminderType[] = [
  {
    id: "1",
    title: "Team Meeting",
    description: "Weekly team sync",
    timezone: "UTC",
    dateTime: new Date("2023-06-15T10:00:00Z"),
  },
  {
    id: "2",
    title: "Dentist Appointment",
    description: "Regular checkup",
    timezone: "EST",
    dateTime: new Date("2023-06-20T14:30:00Z"),
  },
];

export default function PageOne() {
  const [reminders, setReminders] = useState<ReminderType[]>(mockReminders);
  const [editingReminder, setEditingReminder] = useState<ReminderType | null>(
    null
  );
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReminderType>({
    resolver: zodResolver(ReminderSchema),
    defaultValues: {
      title: "",
      description: "",
      timezone: "",
      dateTime: new Date(),
    },
  });

  useEffect(() => {
    console.log("Fetching reminders...");
    setReminders(mockReminders);
  }, []);

  const onSubmit = (values: ReminderType) => {
    if (editingReminder) {
      const updatedReminders = reminders.map((reminder) =>
        reminder.id === editingReminder.id
          ? { ...reminder, ...values }
          : reminder
      );
      setReminders(updatedReminders);
      setSnackbar({
        open: true,
        message: "Reminder updated!",
        severity: "success",
      });
      setEditingReminder(null);
    } else {
      const newReminder = { ...values, id: Date.now().toString() };
      setReminders([...reminders, newReminder]);
      setSnackbar({
        open: true,
        message: "Reminder added!",
        severity: "success",
      });
    }
    reset();
  };

  const handleEdit = (reminder: ReminderType) => {
    setEditingReminder(reminder);
    reset(reminder);
  };

  const handleDelete = (id: string) => {
    setReminders(reminders.filter((reminder) => reminder.id !== id));
    setSnackbar({
      open: true,
      message: "Reminder deleted!",
      severity: "success",
    });
  };

  return (
    <>
      <Helmet>
        <title> Page One | fastfy-react-starter</title>
      </Helmet>

      <Container maxWidth="xl">
        <Card sx={{ maxWidth: 800, margin: "auto", mt: 4 }}>
          <CardHeader
            title={
              <Typography variant="h4" align="center">
                📅 Reminder Settings
              </Typography>
            }
          />
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Title"
                      error={!!errors.title}
                      helperText={errors.title?.message}
                    />
                  )}
                />
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description"
                      multiline
                      rows={3}
                    />
                  )}
                />
                <Controller
                  name="timezone"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.timezone}>
                      <InputLabel>Timezone</InputLabel>
                      <Select {...field} label="Timezone">
                        <MenuItem value="UTC">UTC</MenuItem>
                        <MenuItem value="EST">EST</MenuItem>
                        <MenuItem value="PST">PST</MenuItem>
                      </Select>
                      {errors.timezone && (
                        <Typography variant="caption" color="error">
                          {errors.timezone.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
                {/* <Controller
                  name="dateTime"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label="Date and Time"
                      {...field}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.dateTime,
                          helperText: errors.dateTime?.message,
                        },
                      }}
                    />
                  )} */}
                {/* /> */}
                <Button type="submit" variant="contained" color="primary">
                  {editingReminder ? "Update Reminder" : "Add Reminder"}
                </Button>
              </Box>
            </form>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                Your Reminders
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Timezone</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reminders.map((reminder) => (
                    <TableRow key={reminder.id}>
                      <TableCell>{reminder.title}</TableCell>
                      <TableCell>{reminder.description}</TableCell>
                      <TableCell>{reminder.timezone}</TableCell>
                      <TableCell>
                        {reminder.dateTime.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleEdit(reminder)}
                          variant="outlined"
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(reminder.id!)}
                          variant="contained"
                          color="secondary"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </CardContent>
        </Card>
      </Container>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

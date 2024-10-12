import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
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
  CircularProgress,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { trpcFetch } from "@/trpc/trpcFetch";

// Extend dayjs with UTC and timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Validation schema
const ReminderSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable(),
  timezone: z.string().min(1, "Timezone is required"),
  dateTime: z.string(),
});

type ReminderType = z.infer<typeof ReminderSchema>;

// Common timezones
const commonTimezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function ReminderPage() {
  const [reminders, setReminders] = useState<ReminderType[]>([]);
  const [editingReminder, setEditingReminder] = useState<ReminderType | null>(
    null
  );
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues = {
    title: "",
    description: "",
    timezone: "",
    dateTime: dayjs().format(),
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReminderType>({
    resolver: zodResolver(ReminderSchema),
    defaultValues,
  });

  const selectedTimezone = watch("timezone");

  // Fetch reminders on load
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const data = await trpcFetch.reminder.getAllReminder.query();
        setReminders(data);
      } catch (error) {
        console.error("Error fetching reminders:", error);
        setSnackbar({
          open: true,
          message: "Failed to fetch reminders",
          severity: "error",
        });
      }
    };
    fetchReminders();
  }, []);

  const onSubmit = async (values: ReminderType) => {
    console.log("Submitting reminder:", values);
    setIsSubmitting(true);
    try {
      if (editingReminder) {
        await trpcFetch.reminder.updaeReminder.mutate({
          dateTime: values.dateTime,
          description: values.description || "",
          id: editingReminder.id!,
          title: values.title,
          timezone: values.timezone,
        });
        setSnackbar({
          open: true,
          message: "Reminder updated!",
          severity: "success",
        });
        setEditingReminder(null);
      } else {
        const newReminder = await trpcFetch.reminder.addReminder.mutate({
          ...values,
          description: values.description || "",
        });
        console.log("New reminder:", newReminder);
        setSnackbar({
          open: true,
          message: "Reminder added!",
          severity: "success",
        });
      }
      reset(defaultValues);
      // Refetch reminders after mutation
      const updatedReminders = await trpcFetch.reminder.getAllReminder.query();
      setReminders(updatedReminders);
    } catch (error) {
      console.error("Error submitting reminder:", error);
      setSnackbar({
        open: true,
        message: "Failed to save reminder",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (reminder: ReminderType) => {
    setEditingReminder(reminder);
    reset(reminder);
  };

  const handleDelete = async (id: string) => {
    try {
      await trpcFetch.reminder.deleteReminder.mutate({ id });
      setReminders(reminders.filter((reminder) => reminder.id !== id));
      setSnackbar({
        open: true,
        message: "Reminder deleted!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error deleting reminder:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete reminder",
        severity: "error",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Reminder Settings | My App</title>
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
                        {commonTimezones.map((tz) => (
                          <MenuItem key={tz} value={tz}>
                            {tz}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.timezone && (
                        <Typography variant="caption" color="error">
                          {errors.timezone.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
                <Controller
                  name="dateTime"
                  control={control}
                  render={({ field }) => (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DateTimePicker
                        label="Date and Time"
                        value={dayjs(field.value)}
                        onChange={(newValue) =>
                          field.onChange(
                            newValue?.tz(selectedTimezone).format()
                          )
                        }
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.dateTime,
                            helperText: errors.dateTime?.message,
                          },
                          inputAdornment: {
                            position: "end",
                          },
                        }}
                        disablePast
                      />
                    </LocalizationProvider>
                  )}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} />
                  ) : editingReminder ? (
                    "Update Reminder"
                  ) : (
                    "Add Reminder"
                  )}
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
                        {dayjs(reminder.dateTime).format(
                          "YYYY-MM-DD HH:mm:ss Z"
                        )}
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

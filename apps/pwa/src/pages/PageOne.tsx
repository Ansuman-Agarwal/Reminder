import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Card,
  CardContent,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { trpcFetch } from "@/trpc/trpcFetch";
import { useMediaQuery } from "react-responsive";
import { useAuthContext } from "@/auth/useAuthContext";
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

interface ReminderType extends z.infer<typeof ReminderSchema> {
  status: "pending" | "completed" | "failed";
}

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
  const { user } = useAuthContext();
  console.log(user);
  const [reminders, setReminders] = useState<ReminderType[]>([]);
  const [editingReminder, setEditingReminder] = useState<ReminderType | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

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
      } else {
        await trpcFetch.reminder.addReminder.mutate({
          ...values,
          description: values.description || "",
        });
        setSnackbar({
          open: true,
          message: "Reminder added!",
          severity: "success",
        });
      }
      reset(defaultValues);
      setIsDialogOpen(false);
      setEditingReminder(null);
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
    setIsDialogOpen(true);
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

  const handleOpenDialog = () => {
    reset(defaultValues);
    setEditingReminder(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingReminder(null);
    reset(defaultValues);
  };

  return (
    <>
      <Helmet>
        <title>Reminder Settings | My App</title>
      </Helmet>

      <Container maxWidth="xl">
        <Card sx={{ margin: "auto", mt: 4, overflowX: "auto" }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 2 : 0,
              }}
            >
              <Typography variant="h4">📅 Reminder Settings</Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
              >
                Add Reminder
              </Button>
            </Box>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  {!isMobile && <TableCell>Description</TableCell>}
                  {!isMobile && <TableCell>Timezone</TableCell>}
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell>{truncateText(reminder.title, 20)}</TableCell>
                    {!isMobile && (
                      <TableCell>
                        {truncateText(reminder.description || "", 30)}
                      </TableCell>
                    )}
                    {!isMobile && <TableCell>{reminder.timezone}</TableCell>}
                    <TableCell>
                      {dayjs(reminder.dateTime).format(
                        isMobile ? "MM/DD/YY HH:mm" : "YYYY-MM-DD HH:mm:ss Z"
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={reminder.status}
                        color={
                          reminder.status === "completed"
                            ? "success"
                            : reminder.status === "failed"
                              ? "error"
                              : "warning"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: isMobile ? "column" : "row",
                          gap: 1,
                        }}
                      >
                        <Button
                          disabled={reminder.status !== "pending"}
                          onClick={() => handleEdit(reminder)}
                          variant="outlined"
                          size={isMobile ? "small" : "medium"}
                          startIcon={<ModeEditIcon />}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(reminder.id!)}
                          variant="contained"
                          color="error"
                          size={isMobile ? "small" : "medium"}
                          startIcon={<DeleteIcon />}
                        >
                          Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Container>

      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingReminder ? "Edit Reminder" : "Add New Reminder"}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
            >
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Title"
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    fullWidth
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
                    fullWidth
                  />
                )}
              />
              <Controller
                name="timezone"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.timezone} fullWidth>
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
                        field.onChange(newValue?.tz(selectedTimezone).format())
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
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
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
          </DialogActions>
        </form>
      </Dialog>

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

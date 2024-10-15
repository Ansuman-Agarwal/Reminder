import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
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
  TextField,
  Typography,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import Chip from "@mui/material/Chip";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { trpcFetch } from "@/trpc/trpcFetch";

// Import countries-list and extend the ICountry type
import { countries as countriesRaw, ICountry } from "countries-list";

interface CountryWithEmoji extends ICountry {
  emoji: string;
}

const countries = Object.entries(countriesRaw).map(([code, data]) => ({
  code,
  name: data.name,
  flag: (data as CountryWithEmoji).emoji,
  dialCode: data.phone[0],
}));

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

// Validation schema
const ProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  preferedTimezone: z.string().nullable(),
  isWhatsappVerified: z.boolean().default(false),
  countryCode: z.string().min(1, "Country code is required"),
  whatsappNumber: z
    .string()
    .min(1, "Enter a valid 10 digit mobile number without country code")
    .max(10, "Enter a valid 10 digit mobile number without country code"),
});

type ProfileType = z.infer<typeof ProfileSchema>;

// Define the type for the API response
type UserApiResponse = {
  id: string;
  name: string;
  email: string;
  isWhatsappVerified: boolean;
  isVerified: boolean;
  profilePicture: string | null;
  preferedTimezone: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  whatsappNumber: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserApiResponse | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCountryCode = (phoneNumber: string): string => {
    const country = countries.find((c) =>
      phoneNumber.startsWith(c.dialCode.toString())
    );
    return country ? country.code : "";
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileType>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      preferedTimezone: null,
      countryCode: "",
      whatsappNumber: "",
    },
  });

  const watchCountryCode = watch("countryCode");
  const watchWhatsappNumber = watch("whatsappNumber");

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await trpcFetch.user.getCurrentUser.query();
        if (userData.id) {
          setUser(userData);
          const countryCode = getCountryCode(userData.whatsappNumber || "");
          const number =
            userData.whatsappNumber?.replace(countryCode, "") || "";
          const profileData: ProfileType = {
            name: userData.name,
            email: userData.email,
            preferedTimezone: userData.preferedTimezone,
            isWhatsappVerified: userData.isWhatsappVerified,
            countryCode,
            whatsappNumber: number.slice(2),
          };
          reset(profileData);
        } else {
          throw new Error("No user data found");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setSnackbar({
          open: true,
          message: "Failed to fetch user data",
          severity: "error",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [reset]);

  const onSubmit = async (values: ProfileType) => {
    setIsSubmitting(true);
    try {
      const country = countries.find((c) => c.code === values.countryCode);
      const fullWhatsappNumber = country
        ? country.dialCode + values.whatsappNumber
        : values.whatsappNumber;

      const updatedUser = await trpcFetch.user.updateUser.mutate({
        email: values.email,
        name: values.name,
        preferedTimezone: values.preferedTimezone ?? "Asia/Kolkata",
        whatsappNumber: fullWhatsappNumber,
      });

      setUser(updatedUser);
      setSnackbar({
        open: true,
        message: "Profile updated successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setSnackbar({
        open: true,
        message: "Failed to update profile",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestVerification = async () => {
    if (!watchCountryCode || !watchWhatsappNumber) {
      setSnackbar({
        open: true,
        message: "Please enter your WhatsApp number with country code",
        severity: "error",
      });
      return;
    }

    try {
      const loginPollData =
        await trpcFetch.user.sendWhatsappVerificationCode.mutate();
      console.log(loginPollData);
      setSnackbar({
        open: true,
        message: "Verification request sent successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error requesting verification:", error);
      setSnackbar({
        open: true,
        message: "Failed to request verification",
        severity: "error",
      });
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  return (
    <>
      <Helmet>
        <title>User Profile | My App</title>
      </Helmet>

      <Container maxWidth="xl">
        <Card sx={{ maxWidth: 600, margin: "auto", mt: 4 }}>
          <CardHeader
            title={
              <Typography variant="h4" align="center">
                👤 User Profile
              </Typography>
            }
          />
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Name"
                      error={!!errors.name}
                      helperText={errors.name?.message}
                    />
                  )}
                />
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    maxLength: 10,
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Controller
                    name="countryCode"
                    control={control}
                    render={({ field }) => (
                      <FormControl
                        error={!!errors.countryCode}
                        sx={{ width: "40%" }}
                      >
                        <InputLabel>Country</InputLabel>
                        <Select {...field} label="Country">
                          {countries.map((country) => (
                            <MenuItem key={country.code} value={country.code}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <span>{country.flag}</span>
                                <span>{country.name}</span>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                  <Controller
                    name="whatsappNumber"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="WhatsApp Number"
                        error={!!errors.whatsappNumber}
                        helperText={errors.whatsappNumber?.message}
                        sx={{ width: "60%" }}
                      />
                    )}
                  />
                </Box>
                {user?.whatsappNumber && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Chip
                      color={user?.isWhatsappVerified ? "success" : "error"}
                      label={
                        user?.isWhatsappVerified ? "Verified" : "Not Verified"
                      }
                      variant="outlined"
                    />

                    {!user?.isWhatsappVerified && (
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleRequestVerification}
                        disabled={!watchCountryCode || !watchWhatsappNumber}
                      >
                        Request Verification
                      </Button>
                    )}
                  </Box>
                )}
                <Controller
                  name="preferedTimezone"
                  control={control}
                  render={({ field }) => (
                    <FormControl error={!!errors.preferedTimezone}>
                      <InputLabel>Preferred Timezone</InputLabel>
                      <Select {...field} label="Preferred Timezone">
                        {commonTimezones.map((tz) => (
                          <MenuItem key={tz} value={tz}>
                            {tz}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.preferedTimezone && (
                        <Typography variant="caption" color="error">
                          {errors.preferedTimezone.message}
                        </Typography>
                      )}
                    </FormControl>
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
                  ) : (
                    "Update Profile"
                  )}
                </Button>
              </Box>
            </form>
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

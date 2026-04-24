import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Link,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Paper,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import SignatureCanvas from "react-signature-canvas";

const COMPANY_OPTIONS_STORAGE_KEY = "companyOptions";
const DEFAULT_COMPANY_OPTIONS = ["SGS (MALAYSIA) SDN BHD", "Petrotechnical Inspection (M) Sdn Bhd"];
const STAFF_CATEGORY_OPTIONS_STORAGE_KEY = "staffCategoryOptions";
const DEFAULT_STAFF_CATEGORY_OPTIONS = [
    "Executive",
    "Non Executive",
    "Division Manager",
    "Manager",
    "Subject Matter Expert"
];
const NATURE_OF_WORK_OPTIONS_STORAGE_KEY = "natureOfWorkOptions";
const DEFAULT_NATURE_OF_WORK_OPTIONS = ["Site", "Lab", "Offshore", "Office"];
const CLINIC_OPTIONS_STORAGE_KEY = "clinicOptions";
const DEFAULT_CLINIC_OPTIONS = [
    {
        name: "POLIKLINIK ROZIKIN - AIR BIRU BRANCH",
        address: "No. 35, Jalan 9/17, Pengkalan 9, Taman Air Biru, 81750 Pasir Gudang, Johor",
        telephone: "07-2521389"
    }
];

function isDateField(field) {
    const lowered = `${field.key} ${field.label}`.toLowerCase();
    return lowered.includes("date") || lowered.includes("today");
}

function isValidityStartField(field) {
    const lowered = `${field.key} ${field.label}`.toLowerCase();
    return lowered.includes("validity") && lowered.includes("start") && lowered.includes("date");
}

function isValidityEndField(field) {
    const lowered = `${field.key} ${field.label}`.toLowerCase();
    return lowered.includes("validity") && lowered.includes("end") && lowered.includes("date");
}

function formatForSubmit(field, value) {
    if (!isDateField(field)) {
        return value || "";
    }
    if (!value) {
        return "";
    }
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
}

function isCompanyField(field) {
    const lowered = `${field.key} ${field.label}`.toLowerCase();
    return lowered === "company" || lowered.includes("company");
}

function isSignatureField(field) {
    const lowered = `${field.key} ${field.label}`.toLowerCase();
    return lowered === "signature" || lowered.includes("signature");
}

function isStaffCategoryField(field) {
    const lowered = `${field.key} ${field.label}`.toLowerCase();
    return lowered === "staff_category" || lowered.includes("staff") && lowered.includes("category");
}

function isNatureOfWorkField(field) {
    const lowered = `${field.key} ${field.label}`.toLowerCase();
    return lowered === "nature_of_work" || lowered.includes("nature") && lowered.includes("work");
}

function isClinicNameField(field) {
    const lowered = `${field.key} ${field.label}`.toLowerCase();
    return lowered === "clinic_s_name" || lowered.includes("clinic") && lowered.includes("name");
}

function isClinicAddressField(field) {
    const lowered = `${field.key} ${field.label}`.toLowerCase();
    return lowered === "clinic_address" || lowered.includes("clinic") && lowered.includes("address");
}

function isClinicTelephoneField(field) {
    const lowered = `${field.key} ${field.label}`.toLowerCase();
    return lowered === "clinic_telephone" || lowered.includes("clinic") && lowered.includes("telephone");
}

function loadSimpleOptions(storageKey, defaults) {
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
            return [...defaults];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...defaults];
        }
        const cleaned = parsed
            .map((value) => (typeof value === "string" ? value.trim() : ""))
            .filter(Boolean);
        const merged = [...new Set([...defaults, ...cleaned])];
        return merged.length > 0 ? merged : [...defaults];
    } catch (_error) {
        return [...defaults];
    }
}

function loadCompanyOptions() {
    return loadSimpleOptions(COMPANY_OPTIONS_STORAGE_KEY, DEFAULT_COMPANY_OPTIONS);
}

function loadClinicOptions() {
    try {
        const raw = localStorage.getItem(CLINIC_OPTIONS_STORAGE_KEY);
        if (!raw) {
            return [...DEFAULT_CLINIC_OPTIONS];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...DEFAULT_CLINIC_OPTIONS];
        }
        const cleaned = parsed
            .map((item) => ({
                name: typeof item?.name === "string" ? item.name.trim() : "",
                address: typeof item?.address === "string" ? item.address.trim() : "",
                telephone: typeof item?.telephone === "string" ? item.telephone.trim() : ""
            }))
            .filter((item) => item.name.length > 0);
        const merged = [...DEFAULT_CLINIC_OPTIONS];
        for (const clinic of cleaned) {
            if (!merged.some((item) => item.name.toLowerCase() === clinic.name.toLowerCase())) {
                merged.push(clinic);
            }
        }
        return merged.length > 0 ? merged : [...DEFAULT_CLINIC_OPTIONS];
    } catch (_error) {
        return [...DEFAULT_CLINIC_OPTIONS];
    }
}

export default function App() {
    const [fields, setFields] = useState([]);
    const [values, setValues] = useState({});
    const [status, setStatus] = useState({ type: "info", message: "" });
    const [files, setFiles] = useState(null);
    const [warning, setWarning] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [companyOptions, setCompanyOptions] = useState(loadCompanyOptions);
    const [staffCategoryOptions, setStaffCategoryOptions] = useState(
        () => loadSimpleOptions(STAFF_CATEGORY_OPTIONS_STORAGE_KEY, DEFAULT_STAFF_CATEGORY_OPTIONS)
    );
    const [natureOfWorkOptions, setNatureOfWorkOptions] = useState(
        () => loadSimpleOptions(NATURE_OF_WORK_OPTIONS_STORAGE_KEY, DEFAULT_NATURE_OF_WORK_OPTIONS)
    );
    const [clinicOptions, setClinicOptions] = useState(loadClinicOptions);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [newCompanyOption, setNewCompanyOption] = useState("");
    const [isStaffCategoryModalOpen, setIsStaffCategoryModalOpen] = useState(false);
    const [newStaffCategoryOption, setNewStaffCategoryOption] = useState("");
    const [isNatureOfWorkModalOpen, setIsNatureOfWorkModalOpen] = useState(false);
    const [newNatureOfWorkOption, setNewNatureOfWorkOption] = useState("");
    const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
    const [newClinic, setNewClinic] = useState({ name: "", address: "", telephone: "" });
    const signatureRefs = useRef({});

    useEffect(() => {
        localStorage.setItem(COMPANY_OPTIONS_STORAGE_KEY, JSON.stringify(companyOptions));
    }, [companyOptions]);

    useEffect(() => {
        localStorage.setItem(STAFF_CATEGORY_OPTIONS_STORAGE_KEY, JSON.stringify(staffCategoryOptions));
    }, [staffCategoryOptions]);

    useEffect(() => {
        localStorage.setItem(NATURE_OF_WORK_OPTIONS_STORAGE_KEY, JSON.stringify(natureOfWorkOptions));
    }, [natureOfWorkOptions]);

    useEffect(() => {
        localStorage.setItem(CLINIC_OPTIONS_STORAGE_KEY, JSON.stringify(clinicOptions));
    }, [clinicOptions]);

    function addCompanyOption(optionValue) {
        const normalized = (optionValue || "").trim();
        if (!normalized) {
            return;
        }
        setCompanyOptions((prev) => {
            if (prev.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
                return prev;
            }
            return [...prev, normalized];
        });
    }

    function removeCompanyOption(optionToRemove) {
        setCompanyOptions((prev) => {
            const filtered = prev.filter((item) => item.toLowerCase() !== optionToRemove.toLowerCase());
            const nextOptions = filtered.length > 0 ? filtered : [...DEFAULT_COMPANY_OPTIONS];

            setValues((currentValues) => {
                const companyField = fields.find((field) => isCompanyField(field));
                if (!companyField) {
                    return currentValues;
                }
                const currentCompany = (currentValues[companyField.key] || "").trim().toLowerCase();
                if (currentCompany !== optionToRemove.toLowerCase()) {
                    return currentValues;
                }
                return {
                    ...currentValues,
                    [companyField.key]: nextOptions[0] || ""
                };
            });

            return nextOptions;
        });
    }

    function addManagedOption(optionValue, setOptions) {
        const normalized = (optionValue || "").trim();
        if (!normalized) {
            return;
        }
        setOptions((prev) => {
            if (prev.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
                return prev;
            }
            return [...prev, normalized];
        });
    }

    function removeManagedOption(optionToRemove, setOptions, defaultOptions, fieldMatcher) {
        setOptions((prev) => {
            const filtered = prev.filter((item) => item.toLowerCase() !== optionToRemove.toLowerCase());
            const nextOptions = filtered.length > 0 ? filtered : [...defaultOptions];

            setValues((currentValues) => {
                const targetField = fields.find((field) => fieldMatcher(field));
                if (!targetField) {
                    return currentValues;
                }
                const currentValue = (currentValues[targetField.key] || "").trim().toLowerCase();
                if (currentValue !== optionToRemove.toLowerCase()) {
                    return currentValues;
                }
                return {
                    ...currentValues,
                    [targetField.key]: nextOptions[0] || ""
                };
            });

            return nextOptions;
        });
    }

    function upsertClinicOption(clinic) {
        const normalized = {
            name: (clinic.name || "").trim(),
            address: (clinic.address || "").trim(),
            telephone: (clinic.telephone || "").trim()
        };
        if (!normalized.name) {
            return;
        }
        setClinicOptions((prev) => {
            const existingIndex = prev.findIndex((item) => item.name.toLowerCase() === normalized.name.toLowerCase());
            if (existingIndex >= 0) {
                const next = [...prev];
                next[existingIndex] = normalized;
                return next;
            }
            return [...prev, normalized];
        });
    }

    function applyClinicToValues(clinicName) {
        const selected = clinicOptions.find((item) => item.name.toLowerCase() === (clinicName || "").trim().toLowerCase());
        const clinicNameField = fields.find((field) => isClinicNameField(field));
        const clinicAddressField = fields.find((field) => isClinicAddressField(field));
        const clinicTelephoneField = fields.find((field) => isClinicTelephoneField(field));

        setValues((prev) => {
            const next = { ...prev };
            if (clinicNameField) {
                next[clinicNameField.key] = clinicName || "";
            }
            if (selected && clinicAddressField) {
                next[clinicAddressField.key] = selected.address || "";
            }
            if (selected && clinicTelephoneField) {
                next[clinicTelephoneField.key] = selected.telephone || "";
            }
            return next;
        });
    }

    function removeClinicOption(clinicName) {
        setClinicOptions((prev) => {
            const filtered = prev.filter((item) => item.name.toLowerCase() !== clinicName.toLowerCase());
            const nextOptions = filtered.length > 0 ? filtered : [...DEFAULT_CLINIC_OPTIONS];

            setValues((currentValues) => {
                const clinicNameField = fields.find((field) => isClinicNameField(field));
                const clinicAddressField = fields.find((field) => isClinicAddressField(field));
                const clinicTelephoneField = fields.find((field) => isClinicTelephoneField(field));
                if (!clinicNameField) {
                    return currentValues;
                }
                const currentClinic = (currentValues[clinicNameField.key] || "").trim().toLowerCase();
                if (currentClinic !== clinicName.toLowerCase()) {
                    return currentValues;
                }
                const replacement = nextOptions[0];
                return {
                    ...currentValues,
                    [clinicNameField.key]: replacement?.name || "",
                    ...(clinicAddressField ? { [clinicAddressField.key]: replacement?.address || "" } : {}),
                    ...(clinicTelephoneField ? { [clinicTelephoneField.key]: replacement?.telephone || "" } : {})
                };
            });

            return nextOptions;
        });
    }

    useEffect(() => {
        async function bootstrap() {
            const [schemaResponse, defaultsResponse] = await Promise.all([
                fetch("/api/schema"),
                fetch("/api/defaults")
            ]);
            const schemaData = await schemaResponse.json();
            const defaultsData = await defaultsResponse.json();
            const editableFields = schemaData.editableFields || [];
            const initialValues = { ...(defaultsData || {}) };
            const companyField = editableFields.find((field) => isCompanyField(field));
            if (companyField && !initialValues[companyField.key]) {
                initialValues[companyField.key] = companyOptions[0] || "";
            }
            const staffCategoryField = editableFields.find((field) => isStaffCategoryField(field));
            if (staffCategoryField && !initialValues[staffCategoryField.key]) {
                initialValues[staffCategoryField.key] = "";
            }
            const natureOfWorkField = editableFields.find((field) => isNatureOfWorkField(field));
            if (natureOfWorkField && !initialValues[natureOfWorkField.key]) {
                initialValues[natureOfWorkField.key] = "";
            }
            const clinicNameField = editableFields.find((field) => isClinicNameField(field));
            const clinicAddressField = editableFields.find((field) => isClinicAddressField(field));
            const clinicTelephoneField = editableFields.find((field) => isClinicTelephoneField(field));
            if (clinicNameField && !initialValues[clinicNameField.key]) {
                initialValues[clinicNameField.key] = "";
            }
            if (clinicAddressField && !initialValues[clinicAddressField.key]) {
                initialValues[clinicAddressField.key] = "";
            }
            if (clinicTelephoneField && !initialValues[clinicTelephoneField.key]) {
                initialValues[clinicTelephoneField.key] = "";
            }
            const validityStartField = editableFields.find((field) => isValidityStartField(field));
            const validityEndField = editableFields.find((field) => isValidityEndField(field));
            if (validityStartField && !initialValues[validityStartField.key]) {
                initialValues[validityStartField.key] = dayjs().format("YYYY-MM-DD");
            }
            if (validityEndField && !initialValues[validityEndField.key]) {
                initialValues[validityEndField.key] = dayjs().add(14, "day").format("YYYY-MM-DD");
            }

            setFields(editableFields);
            setValues(initialValues);
        }

        bootstrap().catch((error) => {
            setStatus({ type: "error", message: `Setup failed: ${error.message}` });
        });
    }, []);

    const groupedFields = useMemo(() => {
        return fields.map((field) => ({
            ...field,
            isDate: isDateField(field)
        }));
    }, [fields]);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setFiles(null);
        setWarning("");
        setStatus({ type: "info", message: "Generating..." });

        try {
            const payload = {};
            for (const field of fields) {
                payload[field.key] = formatForSubmit(field, values[field.key]);
            }

            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || data.message || "Generation failed");
            }

            setFiles(data.files);
            setWarning(data.warning || "");
            setStatus({ type: "success", message: data.message || "Generated successfully." });
        } catch (error) {
            setStatus({ type: "error", message: `Failed: ${error.message}` });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack spacing={2}>
                <Typography variant="h4">Letter Template Generator</Typography>
                <Typography color="text.secondary">
                    Editable fields are derived from `//` markers in the locked master template.
                </Typography>

                <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        {groupedFields.map((field) => {
                            const value = values[field.key] || "";
                            if (isValidityEndField(field)) {
                                return null;
                            }
                            if (isValidityStartField(field)) {
                                const endField = groupedFields.find((item) => isValidityEndField(item));
                                const endValue = endField ? (values[endField.key] || "") : "";
                                return (
                                    <Stack key={field.key} spacing={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            Validity Period
                                        </Typography>
                                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                            <DatePicker
                                                label="Validity Start Date"
                                                value={value ? dayjs(value) : null}
                                                onChange={(newValue) => {
                                                    const formattedStart = newValue ? newValue.format("YYYY-MM-DD") : "";
                                                    const formattedEnd = newValue
                                                        ? newValue.add(13, "day").format("YYYY-MM-DD")
                                                        : "";
                                                    setValues((prev) => ({
                                                        ...prev,
                                                        [field.key]: formattedStart,
                                                        ...(endField ? { [endField.key]: formattedEnd } : {})
                                                    }));
                                                }}
                                                slotProps={{ textField: { required: true, fullWidth: true } }}
                                            />
                                            <DatePicker
                                                label="Validity End Date"
                                                value={endValue ? dayjs(endValue) : null}
                                                onChange={(newValue) => {
                                                    if (!endField) {
                                                        return;
                                                    }
                                                    setValues((prev) => ({
                                                        ...prev,
                                                        [endField.key]: newValue ? newValue.format("YYYY-MM-DD") : ""
                                                    }));
                                                }}
                                                slotProps={{ textField: { required: true, fullWidth: true } }}
                                            />
                                        </Stack>
                                    </Stack>
                                );
                            }
                            if (field.isDate) {
                                return (
                                    <DatePicker
                                        key={field.key}
                                        label={field.label}
                                        value={value ? dayjs(value) : null}
                                        onChange={(newValue) => {
                                            setValues((prev) => ({
                                                ...prev,
                                                [field.key]: newValue ? newValue.format("YYYY-MM-DD") : ""
                                            }));
                                        }}
                                        slotProps={{
                                            textField: { required: field.required, fullWidth: true }
                                        }}
                                    />
                                );
                            }
                            if (isCompanyField(field)) {
                                return (
                                    <Stack key={field.key} direction="row" spacing={1} alignItems="center">
                                        <Autocomplete
                                            freeSolo
                                            options={companyOptions}
                                            value={value}
                                            sx={{ flex: 1 }}
                                            onChange={(_event, newValue) => {
                                                const nextValue = typeof newValue === "string" ? newValue : (newValue || "");
                                                setValues((prev) => ({ ...prev, [field.key]: nextValue }));
                                                addCompanyOption(nextValue);
                                            }}
                                            onInputChange={(_event, newInputValue) => {
                                                setValues((prev) => ({ ...prev, [field.key]: newInputValue || "" }));
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={field.label}
                                                    required={field.required}
                                                    onBlur={(event) => addCompanyOption(event.target.value)}
                                                />
                                            )}
                                        />
                                        <IconButton
                                            color="primary"
                                            onClick={() => setIsCompanyModalOpen(true)}
                                            aria-label="Manage company options"
                                        >
                                            <SettingsIcon />
                                        </IconButton>
                                    </Stack>
                                );
                            }
                            if (isClinicNameField(field)) {
                                return (
                                    <Stack key={field.key} direction="row" spacing={1} alignItems="center">
                                        <Autocomplete
                                            freeSolo
                                            options={clinicOptions.map((item) => item.name)}
                                            value={value}
                                            sx={{ flex: 1 }}
                                            onChange={(_event, newValue) => {
                                                const nextValue = typeof newValue === "string" ? newValue : (newValue || "");
                                                applyClinicToValues(nextValue);
                                            }}
                                            onInputChange={(_event, newInputValue) => {
                                                setValues((prev) => ({ ...prev, [field.key]: newInputValue || "" }));
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={field.label}
                                                    required={field.required}
                                                    onBlur={(event) => applyClinicToValues(event.target.value)}
                                                />
                                            )}
                                        />
                                        <IconButton
                                            color="primary"
                                            onClick={() => setIsClinicModalOpen(true)}
                                            aria-label="Manage clinic options"
                                        >
                                            <SettingsIcon />
                                        </IconButton>
                                    </Stack>
                                );
                            }
                            if (isStaffCategoryField(field)) {
                                return (
                                    <Stack key={field.key} direction="row" spacing={1} alignItems="center">
                                        <Autocomplete
                                            freeSolo
                                            options={staffCategoryOptions}
                                            value={value}
                                            sx={{ flex: 1 }}
                                            onChange={(_event, newValue) => {
                                                const nextValue = typeof newValue === "string" ? newValue : (newValue || "");
                                                setValues((prev) => ({ ...prev, [field.key]: nextValue }));
                                                addManagedOption(nextValue, setStaffCategoryOptions);
                                            }}
                                            onInputChange={(_event, newInputValue) => {
                                                setValues((prev) => ({ ...prev, [field.key]: newInputValue || "" }));
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={field.label}
                                                    required={field.required}
                                                    onBlur={(event) => addManagedOption(event.target.value, setStaffCategoryOptions)}
                                                />
                                            )}
                                        />
                                        <IconButton
                                            color="primary"
                                            onClick={() => setIsStaffCategoryModalOpen(true)}
                                            aria-label="Manage staff category options"
                                        >
                                            <SettingsIcon />
                                        </IconButton>
                                    </Stack>
                                );
                            }
                            if (isNatureOfWorkField(field)) {
                                return (
                                    <Stack key={field.key} direction="row" spacing={1} alignItems="center">
                                        <Autocomplete
                                            freeSolo
                                            options={natureOfWorkOptions}
                                            value={value}
                                            sx={{ flex: 1 }}
                                            onChange={(_event, newValue) => {
                                                const nextValue = typeof newValue === "string" ? newValue : (newValue || "");
                                                setValues((prev) => ({ ...prev, [field.key]: nextValue }));
                                                addManagedOption(nextValue, setNatureOfWorkOptions);
                                            }}
                                            onInputChange={(_event, newInputValue) => {
                                                setValues((prev) => ({ ...prev, [field.key]: newInputValue || "" }));
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label={field.label}
                                                    required={field.required}
                                                    onBlur={(event) => addManagedOption(event.target.value, setNatureOfWorkOptions)}
                                                />
                                            )}
                                        />
                                        <IconButton
                                            color="primary"
                                            onClick={() => setIsNatureOfWorkModalOpen(true)}
                                            aria-label="Manage nature of work options"
                                        >
                                            <SettingsIcon />
                                        </IconButton>
                                    </Stack>
                                );
                            }
                            if (isSignatureField(field)) {
                                return (
                                    <Stack key={field.key} spacing={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            {field.label}
                                        </Typography>
                                        <Paper variant="outlined" sx={{ p: 1, width: "100%", maxWidth: 520 }}>
                                            <SignatureCanvas
                                                ref={(instance) => {
                                                    signatureRefs.current[field.key] = instance;
                                                }}
                                                penColor="#111111"
                                                canvasProps={{
                                                    width: 500,
                                                    height: 120,
                                                    style: { width: "100%", height: 120 }
                                                }}
                                                onEnd={() => {
                                                    const signaturePad = signatureRefs.current[field.key];
                                                    if (!signaturePad || signaturePad.isEmpty()) {
                                                        setValues((prev) => ({ ...prev, [field.key]: "" }));
                                                        return;
                                                    }
                                                    setValues((prev) => ({
                                                        ...prev,
                                                        [field.key]: signaturePad.toDataURL("image/png")
                                                    }));
                                                }}
                                            />
                                        </Paper>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                variant="outlined"
                                                onClick={() => {
                                                    const signaturePad = signatureRefs.current[field.key];
                                                    if (!signaturePad) {
                                                        return;
                                                    }
                                                    signaturePad.clear();
                                                    setValues((prev) => ({ ...prev, [field.key]: "" }));
                                                }}
                                            >
                                                Clear Signature
                                            </Button>
                                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                                                Draw your signature here.
                                            </Typography>
                                        </Stack>
                                    </Stack>
                                );
                            }

                            return (
                                <TextField
                                    key={field.key}
                                    label={field.label}
                                    value={value}
                                    onChange={(event) => {
                                        setValues((prev) => ({ ...prev, [field.key]: event.target.value }));
                                    }}
                                    required={field.required}
                                    inputProps={{ maxLength: field.maxLength }}
                                    fullWidth
                                />
                            );
                        })}

                        <Button variant="contained" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Generating..." : "Generate Letter"}
                        </Button>
                    </Stack>
                </Box>

                {status.message && <Alert severity={status.type}>{status.message}</Alert>}
                {files?.docx && (
                    <Alert severity="info">
                        DOCX: <Link href={files.docx} target="_blank" rel="noreferrer">{files.docx}</Link>
                        <br />
                        PDF: {files.pdf
                            ? <Link href={files.pdf} target="_blank" rel="noreferrer">{files.pdf}</Link>
                            : "skipped (LibreOffice not found)"}
                    </Alert>
                )}
                {warning && <Alert severity="warning">{warning}</Alert>}
            </Stack>

            <Dialog open={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Manage Company Options</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                label="New company option"
                                value={newCompanyOption}
                                onChange={(event) => setNewCompanyOption(event.target.value)}
                                fullWidth
                            />
                            <IconButton
                                color="primary"
                                onClick={() => {
                                    addCompanyOption(newCompanyOption);
                                    setNewCompanyOption("");
                                }}
                                aria-label="Add company option"
                            >
                                <AddIcon />
                            </IconButton>
                        </Stack>

                        <List dense>
                            {companyOptions.map((option) => (
                                <ListItem key={option} divider>
                                    <ListItemText primary={option} />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            aria-label={`Delete ${option}`}
                                            onClick={() => removeCompanyOption(option)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsCompanyModalOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isClinicModalOpen} onClose={() => setIsClinicModalOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Manage Clinic Options</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Clinic name"
                            value={newClinic.name}
                            onChange={(event) => setNewClinic((prev) => ({ ...prev, name: event.target.value }))}
                            fullWidth
                        />
                        <TextField
                            label="Clinic address"
                            value={newClinic.address}
                            onChange={(event) => setNewClinic((prev) => ({ ...prev, address: event.target.value }))}
                            fullWidth
                            multiline
                            minRows={2}
                        />
                        <TextField
                            label="Clinic telephone"
                            value={newClinic.telephone}
                            onChange={(event) => setNewClinic((prev) => ({ ...prev, telephone: event.target.value }))}
                            fullWidth
                        />
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                upsertClinicOption(newClinic);
                                if (newClinic.name) {
                                    applyClinicToValues(newClinic.name);
                                }
                                setNewClinic({ name: "", address: "", telephone: "" });
                            }}
                        >
                            Add / Update Clinic
                        </Button>

                        <Divider />

                        <List dense>
                            {clinicOptions.map((option) => (
                                <ListItem
                                    key={option.name}
                                    divider
                                    button
                                    onClick={() => {
                                        setNewClinic(option);
                                        applyClinicToValues(option.name);
                                    }}
                                >
                                    <ListItemText
                                        primary={option.name}
                                        secondary={`${option.address || "-"} | ${option.telephone || "-"}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            aria-label={`Delete ${option.name}`}
                                            onClick={() => removeClinicOption(option.name)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsClinicModalOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isStaffCategoryModalOpen} onClose={() => setIsStaffCategoryModalOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Manage Staff Category Options</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                label="New staff category"
                                value={newStaffCategoryOption}
                                onChange={(event) => setNewStaffCategoryOption(event.target.value)}
                                fullWidth
                            />
                            <IconButton
                                color="primary"
                                onClick={() => {
                                    addManagedOption(newStaffCategoryOption, setStaffCategoryOptions);
                                    setNewStaffCategoryOption("");
                                }}
                                aria-label="Add staff category option"
                            >
                                <AddIcon />
                            </IconButton>
                        </Stack>
                        <List dense>
                            {staffCategoryOptions.map((option) => (
                                <ListItem key={option} divider>
                                    <ListItemText primary={option} />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            aria-label={`Delete ${option}`}
                                            onClick={() => removeManagedOption(
                                                option,
                                                setStaffCategoryOptions,
                                                DEFAULT_STAFF_CATEGORY_OPTIONS,
                                                isStaffCategoryField
                                            )}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsStaffCategoryModalOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isNatureOfWorkModalOpen} onClose={() => setIsNatureOfWorkModalOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Manage Nature of Work Options</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                label="New nature of work"
                                value={newNatureOfWorkOption}
                                onChange={(event) => setNewNatureOfWorkOption(event.target.value)}
                                fullWidth
                            />
                            <IconButton
                                color="primary"
                                onClick={() => {
                                    addManagedOption(newNatureOfWorkOption, setNatureOfWorkOptions);
                                    setNewNatureOfWorkOption("");
                                }}
                                aria-label="Add nature of work option"
                            >
                                <AddIcon />
                            </IconButton>
                        </Stack>
                        <List dense>
                            {natureOfWorkOptions.map((option) => (
                                <ListItem key={option} divider>
                                    <ListItemText primary={option} />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            aria-label={`Delete ${option}`}
                                            onClick={() => removeManagedOption(
                                                option,
                                                setNatureOfWorkOptions,
                                                DEFAULT_NATURE_OF_WORK_OPTIONS,
                                                isNatureOfWorkField
                                            )}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsNatureOfWorkModalOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

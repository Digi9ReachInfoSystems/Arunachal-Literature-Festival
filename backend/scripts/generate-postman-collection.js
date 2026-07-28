/**
 * Generates Postman Collection v2.1 for Arunachal Literature Fest API
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = "{{baseUrl}}/api/v1";

const err = {
  400: { success: false, message: "Bad request / validation error" },
  401: { success: false, message: "Not authorized, no token provided" },
  403: { success: false, message: "You do not have permission to perform this action" },
  404: { success: false, message: "Resource not found" },
  500: { success: false, message: "Server error" },
};

function headerJson(auth = false) {
  const h = [{ key: "Content-Type", value: "application/json", type: "text" }];
  if (auth) h.push({ key: "Authorization", value: "Bearer {{token}}", type: "text" });
  return h;
}

function headerAuthOnly() {
  return [{ key: "Authorization", value: "Bearer {{token}}", type: "text" }];
}

function headerMultipart(auth = false) {
  const h = [];
  if (auth) h.push({ key: "Authorization", value: "Bearer {{token}}", type: "text" });
  return h;
}

function url(routePath, pathVars = {}, query = []) {
  const pathParts = routePath.replace(/^\//, "").split("/").filter(Boolean);
  const variables = Object.entries(pathVars).map(([key, value]) => ({
    key,
    value: String(value),
  }));
  return {
    raw: `${base}${routePath.startsWith("/") ? routePath : "/" + routePath}`,
    host: ["{{baseUrl}}"],
    path: ["api", "v1", ...pathParts],
    ...(query.length ? { query } : {}),
    ...(variables.length ? { variable: variables } : {}),
  };
}

function responses(successExample, auth = false, admin = false) {
  const list = [
    {
      name: "Success",
      status: "OK",
      code: successExample.code || 200,
      _postman_previewlanguage: "json",
      header: [{ key: "Content-Type", value: "application/json" }],
      body:
        typeof successExample.body === "string"
          ? successExample.body
          : JSON.stringify(successExample.body, null, 2),
    },
    {
      name: "400 Bad Request",
      status: "Bad Request",
      code: 400,
      _postman_previewlanguage: "json",
      header: [{ key: "Content-Type", value: "application/json" }],
      body: JSON.stringify(err[400], null, 2),
    },
    {
      name: "404 Not Found",
      status: "Not Found",
      code: 404,
      _postman_previewlanguage: "json",
      header: [{ key: "Content-Type", value: "application/json" }],
      body: JSON.stringify(err[404], null, 2),
    },
    {
      name: "500 Internal Server Error",
      status: "Internal Server Error",
      code: 500,
      _postman_previewlanguage: "json",
      header: [{ key: "Content-Type", value: "application/json" }],
      body: JSON.stringify(err[500], null, 2),
    },
  ];
  if (auth) {
    list.splice(1, 0, {
      name: "401 Unauthorized",
      status: "Unauthorized",
      code: 401,
      _postman_previewlanguage: "json",
      header: [{ key: "Content-Type", value: "application/json" }],
      body: JSON.stringify(err[401], null, 2),
    });
  }
  if (admin) {
    list.splice(auth ? 2 : 1, 0, {
      name: "403 Forbidden",
      status: "Forbidden",
      code: 403,
      _postman_previewlanguage: "json",
      header: [{ key: "Content-Type", value: "application/json" }],
      body: JSON.stringify(err[403], null, 2),
    });
  }
  return list;
}

function item({
  name,
  description,
  method,
  path: routePath,
  pathVars = {},
  query = [],
  auth = false,
  admin = false,
  body,
  formdata,
  success,
  event,
  rawUrl,
}) {
  const request = {
    method,
    header: formdata
      ? headerMultipart(auth)
      : body
      ? headerJson(auth)
      : auth
      ? headerAuthOnly()
      : [{ key: "Accept", value: "application/json", type: "text" }],
    url: rawUrl || url(routePath, pathVars, query),
    description: description || "",
  };

  if (body) {
    request.body = {
      mode: "raw",
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: "json" } },
    };
  }
  if (formdata) {
    request.body = { mode: "formdata", formdata };
  }

  const req = {
    name,
    request,
    response: responses(success || { code: 200, body: { success: true } }, auth, admin),
  };
  if (event) req.event = event;
  return req;
}

const loginEvent = [
  {
    listen: "test",
    script: {
      type: "text/javascript",
      exec: [
        "const setCookie = pm.response.headers.get('Set-Cookie') || pm.response.headers.get('set-cookie');",
        "if (setCookie) {",
        "  const match = String(setCookie).match(/token=([^;]+)/);",
        "  if (match && match[1]) {",
        "    pm.collectionVariables.set('token', match[1]);",
        "  }",
        "}",
        "try {",
        "  const json = pm.response.json();",
        "  if (json && json.token) pm.collectionVariables.set('token', json.token);",
        "  if (json && json.access_token) pm.collectionVariables.set('token', json.access_token);",
        "} catch (e) {}",
      ],
    },
  },
];

const captchaEvent = [
  {
    listen: "test",
    script: {
      type: "text/javascript",
      exec: [
        "try {",
        "  const json = pm.response.json();",
        "  if (json && json.captchaId) pm.collectionVariables.set('captchaId', json.captchaId);",
        "} catch (e) {}",
      ],
    },
  },
];

const folders = [];

folders.push({
  name: "Root",
  description: "Health / welcome endpoint",
  item: [
    item({
      name: "Welcome",
      description: "API root welcome message",
      method: "GET",
      path: "/",
      rawUrl: { raw: "{{baseUrl}}/", host: ["{{baseUrl}}"], path: [""] },
      success: { code: 200, body: "Welcome to Arunachal Literature Fest API" },
    }),
  ],
});

folders.push({
  name: "Captcha",
  description: "CAPTCHA generation for login",
  item: [
    item({
      name: "Generate Captcha",
      description: "Generate CAPTCHA (SVG + captchaId). Use captchaId and captchaCode in login.",
      method: "GET",
      path: "/captcha/generate",
      event: captchaEvent,
      success: {
        code: 200,
        body: {
          success: true,
          captchaId: "550e8400-e29b-41d4-a716-446655440000",
          svg: "<svg>...</svg>",
        },
      },
    }),
  ],
});

folders.push({
  name: "View Counter",
  description: "Page view tracking",
  item: [
    item({
      name: "Track View",
      description: "Increment view counter / track guest via signed cookie. Mounted at /api/v1/",
      method: "GET",
      path: "/",
      rawUrl: { raw: "{{baseUrl}}/api/v1/", host: ["{{baseUrl}}"], path: ["api", "v1", ""] },
      success: { code: 200, body: "User Tracked with Cookie: uuid-or-consent-message" },
    }),
    item({
      name: "Get View Counter Data",
      description: "Admin/user: fetch all view counter records. Requires JWT.",
      method: "GET",
      path: "/getView",
      auth: true,
      admin: true,
      success: {
        code: 200,
        body: {
          success: true,
          data: [{ date: "2025-11-20", views: 120, uniqueUser: ["uuid-1"] }],
        },
      },
    }),
  ],
});

folders.push({
  name: "Auth (Onboarding)",
  description:
    "Authentication and user management. Login supports optional encrypted payload via decryptPayload middleware.",
  item: [
    item({
      name: "Login",
      description:
        "Authenticate user. Requires captchaId + captchaCode from /captcha/generate. Sets httpOnly cookie `token`. Supports plain JSON or encrypted payload. Rate limited: 5 req / 5 min. Test script saves token to collection variable.",
      method: "POST",
      path: "/onboarding/login",
      body: {
        email: "admin@example.com",
        password: "SecurePass@123",
        captchaId: "{{captchaId}}",
        captchaCode: "AbCdEfGh",
      },
      success: { code: 200, body: { success: true, message: "Login successful" } },
      event: loginEvent,
    }),
    item({
      name: "Logout",
      description: "Clear auth cookie and log out",
      method: "POST",
      path: "/onboarding/logout",
      success: { code: 200, body: { success: true, message: "Logged out successfully" } },
    }),
    item({
      name: "Add User",
      description: "Admin only. Create a new user. Supports decryptPayload.",
      method: "POST",
      path: "/onboarding/addUser",
      auth: true,
      admin: true,
      body: {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "SecurePass@123",
        confirmPassword: "SecurePass@123",
      },
      success: { code: 201, body: { message: "User added successfully" } },
    }),
    item({
      name: "Get Users",
      description: "Admin only. List all users.",
      method: "GET",
      path: "/onboarding/getUsers",
      auth: true,
      admin: true,
      success: {
        code: 200,
        body: [
          {
            _id: "64f1a2b3c4d5e6f7a8b9c0d1",
            name: "Admin",
            email: "admin@example.com",
            role: "admin",
          },
        ],
      },
    }),
    item({
      name: "Get My Profile",
      description: "Get authenticated user's profile (no password).",
      method: "GET",
      path: "/onboarding/getMyProfile",
      auth: true,
      success: {
        code: 200,
        body: {
          success: true,
          user: {
            _id: "64f1a2b3c4d5e6f7a8b9c0d1",
            name: "Admin",
            email: "admin@example.com",
            role: "admin",
          },
        },
      },
    }),
    item({
      name: "Edit User",
      description:
        "Update user. Admin can edit anyone/role; users can edit own profile. Supports decryptPayload.",
      method: "PUT",
      path: "/onboarding/editUser/:userId",
      pathVars: { userId: "{{userId}}" },
      auth: true,
      body: {
        name: "Jane Updated",
        email: "jane.updated@example.com",
        password: "NewSecure@123",
        confirmPassword: "NewSecure@123",
        role: "user",
      },
      success: {
        code: 200,
        body: {
          message: "User updated successfully",
          user: {
            _id: "{{userId}}",
            name: "Jane Updated",
            email: "jane.updated@example.com",
            role: "user",
          },
        },
      },
    }),
    item({
      name: "Delete User",
      description: "Admin only. Delete user by ID.",
      method: "DELETE",
      path: "/onboarding/deleteUser/:userId",
      pathVars: { userId: "{{userId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "User deleted successfully" } },
    }),
  ],
});

folders.push({
  name: "Event",
  description: "Event schedule, days, time slots, brochure PDF, and PDF generation",
  item: [
    item({
      name: "Add Event",
      description: "Admin. Create event and auto-generate event days from startDate–endDate.",
      method: "POST",
      path: "/event/addEvent",
      auth: true,
      admin: true,
      body: {
        name: "Arunachal Literature Festival 2025",
        description: "Annual literature festival",
        year: 2025,
        month: 11,
        startDate: "2025-11-20",
        endDate: "2025-11-22",
      },
      success: { code: 201, body: { success: true, eventId: "64f1a2b3c4d5e6f7a8b9c0d1" } },
    }),
    item({
      name: "Update Event",
      description: "Admin/user. Update event details.",
      method: "POST",
      path: "/event/updateEvent/:eventId",
      pathVars: { eventId: "{{eventId}}" },
      auth: true,
      body: {
        name: "ALF 2025 Updated",
        description: "Updated description",
        year: 2025,
        month: 11,
        startDate: "2025-11-20",
        endDate: "2025-11-23",
      },
      success: { code: 201, body: { message: "Event updated successfully" } },
    }),
    item({
      name: "Delete Event",
      description: "Admin. Delete event by ID.",
      method: "DELETE",
      path: "/event/deleteEvent/:eventId",
      pathVars: { eventId: "{{eventId}}" },
      auth: true,
      admin: true,
      success: {
        code: 200,
        body: {
          message: "Event and all associated data deleted successfully",
          deletedEvent: "{{eventId}}",
        },
      },
    }),
    item({
      name: "Get Events",
      description: "Admin/user. List all events.",
      method: "GET",
      path: "/event/getEvent",
      auth: true,
      success: {
        code: 200,
        body: [
          {
            _id: "{{eventId}}",
            name: "Arunachal Literature Festival 2025",
            year: 2025,
            month: 11,
            totalDays: 3,
          },
        ],
      },
    }),
    item({
      name: "Get Total Event (with days & times)",
      description: "Public. First event with nested days and time slots.",
      method: "GET",
      path: "/event/totalEvent",
      success: {
        code: 200,
        body: {
          event: { _id: "{{eventId}}", name: "ALF 2025" },
          days: [{ dayNumber: 1, name: "Day 1", times: [] }],
        },
      },
    }),
    item({
      name: "Get Full Event Details",
      description: "Public. Full event details.",
      method: "GET",
      path: "/event/getFullEvent",
      success: { code: 200, body: { event: {}, days: [] } },
    }),
    item({
      name: "Update Event Day",
      description: "Admin/user. Update day name/description.",
      method: "POST",
      path: "/event/updateEventDay/:eventDayId",
      pathVars: { eventDayId: "{{eventDayId}}" },
      auth: true,
      body: { name: "Day 1 - Inaugural", description: "Opening ceremony" },
      success: { code: 201, body: { message: "Event day updated successfully" } },
    }),
    item({
      name: "Get Event Days",
      description: "Admin/user. List all event days.",
      method: "GET",
      path: "/event/getEventDay",
      auth: true,
      success: {
        code: 200,
        body: [{ _id: "{{eventDayId}}", dayNumber: 1, name: "Day 1" }],
      },
    }),
    item({
      name: "Add Time Slot",
      description: "Admin. Add time slot to an event day. Times in HH:MM.",
      method: "POST",
      path: "/event/addTime/:eventId/day/:eventDay_ref",
      pathVars: { eventId: "{{eventId}}", eventDay_ref: "{{eventDayId}}" },
      auth: true,
      admin: true,
      body: {
        startTime: "10:00",
        endTime: "11:00",
        title: "Keynote Address",
        description: "Opening keynote",
        type: "session",
        speaker: "Dr. Example",
      },
      success: { code: 200, body: { message: "Time added successfully" } },
    }),
    item({
      name: "Update Time Slot",
      description: "Admin/user. Update a time slot.",
      method: "POST",
      path: "/event/updateTime/day/:day_ref/time/:timeId",
      pathVars: { day_ref: "{{eventDayId}}", timeId: "{{timeId}}" },
      auth: true,
      body: {
        startTime: "10:30",
        endTime: "11:30",
        title: "Keynote Updated",
        description: "Updated description",
        type: "session",
        speaker: "Dr. Example",
      },
      success: { code: 201, body: { message: "Time updated successfully" } },
    }),
    item({
      name: "Delete Time Slot",
      description: "Admin. Delete time slot.",
      method: "DELETE",
      path: "/event/deleteTime/:timeId",
      pathVars: { timeId: "{{timeId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Time deleted successfully" } },
    }),
    item({
      name: "Get Time Slots",
      description: "Admin/user. List all time slots.",
      method: "GET",
      path: "/event/getTime",
      auth: true,
      success: {
        code: 200,
        body: [
          { _id: "{{timeId}}", startTime: "10:00", endTime: "11:00", title: "Keynote" },
        ],
      },
    }),
    item({
      name: "Add Event Brochure PDF",
      description: "Admin. Upload brochure PDF (multipart field: pdf).",
      method: "POST",
      path: "/event/addPdf",
      auth: true,
      admin: true,
      formdata: [{ key: "pdf", type: "file", src: [], description: "PDF brochure file" }],
      success: {
        code: 201,
        body: {
          success: true,
          message: "Event brochure added successfully",
          data: { _id: "{{brochureId}}", pdf_url: "/uploads/EventBroucher/pdf/file.pdf" },
        },
      },
    }),
    item({
      name: "Get Event Brochures",
      description: "Public. List event brochures.",
      method: "GET",
      path: "/event/getEventBroucher",
      success: {
        code: 200,
        body: [{ _id: "{{brochureId}}", pdf_url: "/uploads/EventBroucher/pdf/file.pdf" }],
      },
    }),
    item({
      name: "Update Event Brochure",
      description: "Admin/user. Replace brochure PDF.",
      method: "POST",
      path: "/event/updateEventBroucher/:id",
      pathVars: { id: "{{brochureId}}" },
      auth: true,
      formdata: [{ key: "pdf", type: "file", src: [] }],
      success: {
        code: 201,
        body: {
          success: true,
          message: "Event brochure updated successfully",
          data: { _id: "{{brochureId}}", pdf_url: "/uploads/EventBroucher/pdf/new.pdf" },
        },
      },
    }),
    item({
      name: "Delete Event Brochure",
      description: "Admin. Delete brochure.",
      method: "DELETE",
      path: "/event/deleteEventBroucher/:id",
      pathVars: { id: "{{brochureId}}" },
      auth: true,
      admin: true,
      success: {
        code: 200,
        body: { success: true, message: "Event brochure deleted successfully" },
      },
    }),
    item({
      name: "Generate Event PDF",
      description: "Public. Generate/download event schedule PDF (application/pdf).",
      method: "GET",
      path: "/event/generatePdf",
      success: { code: 200, body: { message: "PDF binary stream" } },
    }),
  ],
});

folders.push({
  name: "Speaker",
  description: "Speaker years and speakers (with image upload)",
  item: [
    item({
      name: "Add Speaker Year",
      description: "Admin. Create a speaker year bucket.",
      method: "POST",
      path: "/speaker/addYear",
      auth: true,
      admin: true,
      body: { year: 2025, label: "ALF 2025", isActive: true },
      success: {
        code: 201,
        body: {
          message: "Speaker year created successfully",
          speakerYear: { _id: "{{yearId}}", year: 2025, label: "ALF 2025", isActive: true },
        },
      },
    }),
    item({
      name: "Get Speaker Years",
      description: "Public. List speaker years.",
      method: "GET",
      path: "/speaker/getYears",
      success: {
        code: 200,
        body: { years: [{ _id: "{{yearId}}", year: 2025, label: "ALF 2025", isActive: true }] },
      },
    }),
    item({
      name: "Update Speaker Year",
      description: "Admin. Update year label/isActive.",
      method: "POST",
      path: "/speaker/updateYear/:yearId",
      pathVars: { yearId: "{{yearId}}" },
      auth: true,
      admin: true,
      body: { label: "ALF 2025 Updated", isActive: true },
      success: {
        code: 200,
        body: { message: "Speaker year updated successfully", speakerYear: {} },
      },
    }),
    item({
      name: "Delete Speaker Year",
      description: "Admin. Delete year if no linked speakers.",
      method: "DELETE",
      path: "/speaker/deleteYear/:yearId",
      pathVars: { yearId: "{{yearId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Speaker year deleted successfully" } },
    }),
    item({
      name: "Add Speaker",
      description: "Admin. Add speaker under a year. multipart: image_url, name, about.",
      method: "POST",
      path: "/speaker/addSpeaker/:yearId",
      pathVars: { yearId: "{{yearId}}" },
      auth: true,
      admin: true,
      formdata: [
        { key: "name", value: "Dr. Example Speaker", type: "text" },
        { key: "about", value: "Award-winning author and poet", type: "text" },
        { key: "image_url", type: "file", src: [] },
      ],
      success: {
        code: 201,
        body: {
          message: "Speaker added successfully",
          speaker: { _id: "{{speakerId}}", name: "Dr. Example Speaker" },
        },
      },
    }),
    item({
      name: "Get Speakers (Grouped by Year)",
      description: "Public. All years with nested speakers.",
      method: "GET",
      path: "/speaker/getSpeaker",
      success: {
        code: 200,
        body: { years: [{ _id: "{{yearId}}", year: 2025, speakers: [] }] },
      },
    }),
    item({
      name: "Get Speakers by Year",
      description: "Public. Speakers for a specific year.",
      method: "GET",
      path: "/speaker/getSpeaker/:yearId",
      pathVars: { yearId: "{{yearId}}" },
      success: {
        code: 200,
        body: { _id: "{{yearId}}", year: 2025, speakers: [] },
      },
    }),
    item({
      name: "Update Speaker",
      description: "Admin/user. Update speaker. Optional image_url file and yearId.",
      method: "POST",
      path: "/speaker/updateSpeaker/:speakerId",
      pathVars: { speakerId: "{{speakerId}}" },
      auth: true,
      formdata: [
        { key: "name", value: "Updated Speaker", type: "text" },
        { key: "about", value: "Updated bio", type: "text" },
        { key: "yearId", value: "{{yearId}}", type: "text" },
        { key: "image_url", type: "file", src: [] },
      ],
      success: {
        code: 200,
        body: { message: "Speaker updated successfully", updatedSpeaker: {} },
      },
    }),
    item({
      name: "Delete Speaker",
      description: "Admin. Delete speaker and image.",
      method: "DELETE",
      path: "/speaker/deleteSpeaker/:speakerId",
      pathVars: { speakerId: "{{speakerId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Speaker deleted successfully" } },
    }),
  ],
});

folders.push({
  name: "Registration",
  description: "Workshop / registration entries linked to events",
  item: [
    item({
      name: "Add Registration",
      description: "Admin. Add workshop. multipart: imageUrl, name, about, registrationFormUrl.",
      method: "POST",
      path: "/registration/addRegistration/:eventId",
      pathVars: { eventId: "{{eventId}}" },
      auth: true,
      admin: true,
      formdata: [
        { key: "name", value: "Creative Writing Workshop", type: "text" },
        { key: "about", value: "Hands-on writing session", type: "text" },
        {
          key: "registrationFormUrl",
          value: "https://forms.example.com/workshop",
          type: "text",
        },
        { key: "imageUrl", type: "file", src: [] },
      ],
      success: { code: 200, body: { message: "Workshop added successfully" } },
    }),
    item({
      name: "Update Registration",
      description: "Admin/user. Update workshop.",
      method: "POST",
      path: "/registration/updateRegistration/:workshopId",
      pathVars: { workshopId: "{{workshopId}}" },
      auth: true,
      formdata: [
        { key: "name", value: "Updated Workshop", type: "text" },
        { key: "about", value: "Updated about", type: "text" },
        {
          key: "registrationFormUrl",
          value: "https://forms.example.com/workshop-updated",
          type: "text",
        },
        { key: "imageUrl", type: "file", src: [] },
      ],
      success: {
        code: 200,
        body: { message: "workshop updated successfully", updatedworkshop: {} },
      },
    }),
    item({
      name: "Delete Registration",
      description: "Admin. Delete workshop.",
      method: "DELETE",
      path: "/registration/deleteRegistration/:workshopId",
      pathVars: { workshopId: "{{workshopId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Workshop deleted successfully" } },
    }),
    item({
      name: "Get Registrations",
      description: "Public. List all workshops/registrations.",
      method: "GET",
      path: "/registration/getRegistration",
      success: {
        code: 200,
        body: [
          {
            _id: "{{workshopId}}",
            name: "Creative Writing Workshop",
            registrationFormUrl: "https://forms.example.com/workshop",
          },
        ],
      },
    }),
  ],
});

folders.push({
  name: "Archive",
  description: "Archive years, days, and gallery image uploads",
  item: [
    item({
      name: "Add Archive Year",
      description: "Admin. Create year/month and Day 1..totalDays.",
      method: "POST",
      path: "/archive/addyear",
      auth: true,
      admin: true,
      body: { year: 2024, month: 11, totalDays: 3 },
      success: {
        code: 201,
        body: {
          message: "Created 3 days for 11/2024",
          yearMonth: { _id: "{{archiveYearId}}", year: 2024, month: 11 },
          days: [],
        },
      },
    }),
    item({
      name: "Update Archive Year",
      description: "Admin/user. Update year/month and adjust day count.",
      method: "POST",
      path: "/archive/updateyear/:yearId",
      pathVars: { yearId: "{{archiveYearId}}" },
      auth: true,
      body: { year: 2024, month: 11, totalDays: 4 },
      success: {
        code: 200,
        body: { message: "Year updated successfully and days adjusted" },
      },
    }),
    item({
      name: "Delete Archive Year",
      description: "Admin. Delete year, days, and images.",
      method: "DELETE",
      path: "/archive/deleteyear/:yearId",
      pathVars: { yearId: "{{archiveYearId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Year deleted successfully" } },
    }),
    item({
      name: "Upload Archive Images",
      description: "Admin. Upload up to 10 images. Field: image_url (array).",
      method: "POST",
      path: "/archive/uploadImages/:year_ref/year/:dayNumber_ref",
      pathVars: {
        year_ref: "{{archiveYearId}}",
        dayNumber_ref: "{{archiveDayId}}",
      },
      auth: true,
      admin: true,
      formdata: [
        {
          key: "image_url",
          type: "file",
          src: [],
          description: "Image file (repeatable, max 10)",
        },
      ],
      success: {
        code: 201,
        body: { message: "Images uploaded successfully", archives: [] },
      },
    }),
    item({
      name: "Update Archive Image",
      description: "Admin/user. Replace a single image. Field: image_url.",
      method: "POST",
      path: "/archive/updatedImages/:dayNumber_ref/year/:year_ref/image/:imageId",
      pathVars: {
        dayNumber_ref: "{{archiveDayId}}",
        year_ref: "{{archiveYearId}}",
        imageId: "{{imageId}}",
      },
      auth: true,
      formdata: [{ key: "image_url", type: "file", src: [] }],
      success: {
        code: 200,
        body: { message: "image updated successfully", updatedImage: {} },
      },
    }),
    item({
      name: "Get All Images",
      description: "Public. All archive images with year/day populate.",
      method: "GET",
      path: "/archive/getImages",
      success: { code: 200, body: { message: "Image found", archive: [] } },
    }),
    item({
      name: "Get Images By Year (Grouped)",
      description: "Public. Images grouped by year.",
      method: "GET",
      path: "/archive/getImagesByYear",
      success: { code: 200, body: { message: "Images found", archive: [] } },
    }),
    item({
      name: "Get Year-Day Wise Images",
      description: "Public. Images grouped by year then day.",
      method: "GET",
      path: "/archive/getYearDayWiseImages",
      success: { code: 200, body: { message: "Images found", archive: [] } },
    }),
    item({
      name: "Get Images for Year ID",
      description: "Public. Images for a specific archive year.",
      method: "GET",
      path: "/archive/getYearImages/:yearId",
      pathVars: { yearId: "{{archiveYearId}}" },
      success: {
        code: 200,
        body: { message: "Images found for year", archive: { year: 2024, images: [] } },
      },
    }),
    item({
      name: "Get Archive Years",
      description: "Public. Years with nested days.",
      method: "GET",
      path: "/archive/getYear",
      success: {
        code: 200,
        body: {
          years: [
            {
              _id: "{{archiveYearId}}",
              year: 2024,
              month: 11,
              days: [{ _id: "{{archiveDayId}}", dayLabel: "Day 1" }],
            },
          ],
        },
      },
    }),
    item({
      name: "Delete Archive Image",
      description: "Admin. Delete image by ID.",
      method: "DELETE",
      path: "/archive/deleteImages/image/:imageId",
      pathVars: { imageId: "{{imageId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Image deleted successfully" } },
    }),
    item({
      name: "Delete Archive Day",
      description: "Admin. Delete day and its images.",
      method: "DELETE",
      path: "/archive/deleteday/:day_ref",
      pathVars: { day_ref: "{{archiveDayId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Day deleted successfully" } },
    }),
  ],
});

folders.push({
  name: "News And Blog",
  description: "Categories, news (link), and blogs (content) with image upload",
  item: [
    item({
      name: "Add Category",
      description: "Admin. Create category.",
      method: "POST",
      path: "/newsAndBlog/addCategory",
      auth: true,
      admin: true,
      body: { name: "Literature" },
      success: {
        code: 201,
        body: {
          success: true,
          message: "Category added successfully",
          data: { _id: "{{categoryId}}", name: "Literature" },
        },
      },
    }),
    item({
      name: "Get Categories",
      description: "Public. List categories.",
      method: "GET",
      path: "/newsAndBlog/getCategory",
      success: {
        code: 200,
        body: [{ _id: "{{categoryId}}", name: "Literature" }],
      },
    }),
    item({
      name: "Update Category",
      description: "Admin. Update category name.",
      method: "PUT",
      path: "/newsAndBlog/updateCategory/:id",
      pathVars: { id: "{{categoryId}}" },
      auth: true,
      admin: true,
      body: { name: "Poetry" },
      success: {
        code: 200,
        body: { success: true, message: "Category updated successfully", data: {} },
      },
    }),
    item({
      name: "Delete Category",
      description: "Admin. Delete category.",
      method: "DELETE",
      path: "/newsAndBlog/deleteCategory/:id",
      pathVars: { id: "{{categoryId}}" },
      auth: true,
      admin: true,
      success: {
        code: 200,
        body: { success: true, message: "Category deleted successfully" },
      },
    }),
    item({
      name: "Add News And Blog (Link)",
      description: "Admin. contentType=link. multipart: image_url + fields.",
      method: "POST",
      path: "/newsAndBlog/addNewsAndBlog",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Festival Announcement", type: "text" },
        { key: "contentType", value: "link", type: "text" },
        { key: "publishedDate", value: "2025-11-01", type: "text" },
        { key: "link", value: "https://example.com/news", type: "text" },
        { key: "category_ref", value: "{{categoryId}}", type: "text" },
        { key: "image_url", type: "file", src: [] },
      ],
      success: {
        code: 201,
        body: {
          _id: "{{newsAndBlogId}}",
          title: "Festival Announcement",
          contentType: "link",
        },
      },
    }),
    item({
      name: "Add News And Blog (Blog)",
      description: "Admin. contentType=blog. multipart with contents + author.",
      method: "POST",
      path: "/newsAndBlog/addNewsAndBlog",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "A Day at ALF", type: "text" },
        { key: "contentType", value: "blog", type: "text" },
        { key: "publishedDate", value: "2025-11-05", type: "text" },
        { key: "contents", value: "<p>Full blog HTML content...</p>", type: "text" },
        { key: "author", value: "Editor", type: "text" },
        { key: "category_ref", value: "{{categoryId}}", type: "text" },
        { key: "image_url", type: "file", src: [] },
      ],
      success: {
        code: 201,
        body: { _id: "{{newsAndBlogId}}", title: "A Day at ALF", contentType: "blog" },
      },
    }),
    item({
      name: "Get News And Blog",
      description: "Public. List all news and blogs.",
      method: "GET",
      path: "/newsAndBlog/getNewsAndBlog",
      success: { code: 200, body: [] },
    }),
    item({
      name: "Get News And Blog By ID",
      description: "Admin/user. Get by ID.",
      method: "GET",
      path: "/newsAndBlog/getNewsAndBlogById/:newsAndBlogId",
      pathVars: { newsAndBlogId: "{{newsAndBlogId}}" },
      auth: true,
      success: { code: 200, body: { _id: "{{newsAndBlogId}}", title: "Sample" } },
    }),
    item({
      name: "Get Blog Only By ID",
      description: "Public. Returns only if contentType is blog.",
      method: "GET",
      path: "/newsAndBlog/getBlogById/:blogId",
      pathVars: { blogId: "{{blogId}}" },
      success: { code: 200, body: { _id: "{{blogId}}", contentType: "blog" } },
    }),
    item({
      name: "Update News And Blog",
      description: "Admin/user. Update fields + optional image_url.",
      method: "POST",
      path: "/newsAndBlog/updateNewsAndBlog/:newsAndBlogId",
      pathVars: { newsAndBlogId: "{{newsAndBlogId}}" },
      auth: true,
      formdata: [
        { key: "title", value: "Updated Title", type: "text" },
        { key: "contentType", value: "blog", type: "text" },
        { key: "publishedDate", value: "2025-11-06", type: "text" },
        { key: "contents", value: "<p>Updated content</p>", type: "text" },
        { key: "author", value: "Editor", type: "text" },
        { key: "category_ref", value: "{{categoryId}}", type: "text" },
        { key: "image_url", type: "file", src: [] },
      ],
      success: {
        code: 200,
        body: { message: "News or blog updated successfully", updatedNews: {} },
      },
    }),
    item({
      name: "Delete News And Blog",
      description: "Admin. Delete news/blog and image.",
      method: "DELETE",
      path: "/newsAndBlog/deleteNewsAndBlog/:newsAndBlogId",
      pathVars: { newsAndBlogId: "{{newsAndBlogId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "News and blog deleted successfully" } },
    }),
  ],
});

function homeJson(name, desc, method, routePath, opts = {}) {
  return item({
    name,
    description: desc,
    method,
    path: `/homePage${routePath}`,
    ...opts,
  });
}

folders.push({
  name: "Home Page",
  description:
    "Homepage CMS: banners, texts, buttons, poetry, testimonials, intro, contact info",
  item: [
    homeJson("Add Banner", "Admin. Upload banner image (field: image_url).", "POST", "/addBanner", {
      auth: true,
      admin: true,
      formdata: [{ key: "image_url", type: "file", src: [] }],
      success: {
        code: 200,
        body: { message: "Banner Added Successfully", banner: { _id: "{{bannerId}}" } },
      },
    }),
    homeJson("Get Banners", "Public. List banners.", "GET", "/getBanner", {
      success: {
        code: 200,
        body: [{ _id: "{{bannerId}}", image_url: "/uploads/Banner/x.jpg" }],
      },
    }),
    homeJson("Update Banner", "Admin/user. Replace banner image.", "POST", "/updateBanner/:bannerId", {
      pathVars: { bannerId: "{{bannerId}}" },
      auth: true,
      formdata: [{ key: "image_url", type: "file", src: [] }],
      success: { code: 200, body: { message: "Banner updated successfully", banner: {} } },
    }),
    homeJson("Delete Banner", "Admin. Delete banner.", "DELETE", "/deleteBanner/:bannerId", {
      pathVars: { bannerId: "{{bannerId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Banner deleted successfully" } },
    }),
    homeJson("Add Banner Text", "Admin. Create banner text (only one allowed).", "POST", "/addBannerText", {
      auth: true,
      admin: true,
      body: {
        bannerText: "Arunachal Literature Festival",
        bannerSubText: "Celebrating words & culture",
        location: "Itanagar",
        link: "https://litfest.arunachal.gov.in",
      },
      success: {
        code: 201,
        body: { _id: "{{bannerTextId}}", bannerText: "Arunachal Literature Festival" },
      },
    }),
    homeJson("Get Banner Text", "Public.", "GET", "/getBannerText", {
      success: { code: 200, body: [] },
    }),
    homeJson("Update Banner Text", "Admin/user.", "POST", "/updateBannerText/:bannerId", {
      pathVars: { bannerId: "{{bannerTextId}}" },
      auth: true,
      body: {
        bannerText: "Updated Title",
        bannerSubText: "Updated subtitle",
        location: "Itanagar",
        link: "https://litfest.arunachal.gov.in",
      },
      success: { code: 200, body: { _id: "{{bannerTextId}}" } },
    }),
    homeJson("Delete Banner Text", "Admin.", "DELETE", "/deleteBannerText/:bannerId", {
      pathVars: { bannerId: "{{bannerTextId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Text deleted successfully" } },
    }),
    homeJson("Add Button Text", "Admin. CTA button (only one).", "POST", "/addButtonText", {
      auth: true,
      admin: true,
      body: { text: "Register Now", link: "https://example.com/register" },
      success: { code: 201, body: { _id: "{{buttonId}}", text: "Register Now" } },
    }),
    homeJson("Get Button Text", "Public.", "GET", "/getButtonText", {
      success: { code: 200, body: [] },
    }),
    homeJson("Update Button Text", "Admin/user.", "POST", "/updateButtonText/:buttonId", {
      pathVars: { buttonId: "{{buttonId}}" },
      auth: true,
      body: { text: "Join Us", link: "https://example.com/join" },
      success: { code: 201, body: { _id: "{{buttonId}}" } },
    }),
    homeJson("Delete Button Text", "Admin.", "DELETE", "/deleteButtonText/:buttonId", {
      pathVars: { buttonId: "{{buttonId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Text deleted successfully" } },
    }),
    homeJson("Add Poetry", "Admin.", "POST", "/addPoetry", {
      auth: true,
      admin: true,
      body: { text: "Verse about the hills...", author: "Local Poet" },
      success: { code: 201, body: { _id: "{{poetryId}}" } },
    }),
    homeJson("Get Poetry", "Public.", "GET", "/getPoetry", {
      success: { code: 200, body: [] },
    }),
    homeJson("Update Poetry", "Admin/user.", "POST", "/updatePoetry/:poetryId", {
      pathVars: { poetryId: "{{poetryId}}" },
      auth: true,
      body: { text: "Updated verse...", author: "Local Poet" },
      success: { code: 201, body: { _id: "{{poetryId}}" } },
    }),
    homeJson("Delete Poetry", "Admin.", "DELETE", "/deletePoetry/:poetryId", {
      pathVars: { poetryId: "{{poetryId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Poetry deleted successfully" } },
    }),
    homeJson(
      "Add Testimonial",
      "Admin. multipart: image_url, name, about, description.",
      "POST",
      "/addTestimonial",
      {
        auth: true,
        admin: true,
        formdata: [
          { key: "name", value: "Visitor Name", type: "text" },
          { key: "about", value: "Author", type: "text" },
          { key: "description", value: "Amazing festival experience!", type: "text" },
          { key: "image_url", type: "file", src: [] },
        ],
        success: { code: 201, body: { _id: "{{testimonialId}}", name: "Visitor Name" } },
      }
    ),
    homeJson("Get Testimonials", "Public.", "GET", "/getTestimonial", {
      success: { code: 200, body: [] },
    }),
    homeJson("Update Testimonial", "Admin/user.", "POST", "/updateTestimonial/:testimonyId", {
      pathVars: { testimonyId: "{{testimonialId}}" },
      auth: true,
      formdata: [
        { key: "name", value: "Updated Name", type: "text" },
        { key: "about", value: "Poet", type: "text" },
        { key: "description", value: "Updated feedback", type: "text" },
        { key: "image_url", type: "file", src: [] },
      ],
      success: { code: 201, body: { _id: "{{testimonialId}}" } },
    }),
    homeJson("Delete Testimonial", "Admin.", "DELETE", "/deleteTestimonial/:testimonialId", {
      pathVars: { testimonialId: "{{testimonialId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Testimonial deleted successfully" } },
    }),
    homeJson(
      "Add Intro",
      "Admin. multipart: image_url + title, description, date.",
      "POST",
      "/addIntro",
      {
        auth: true,
        admin: true,
        formdata: [
          { key: "title", value: "About ALF", type: "text" },
          { key: "description", value: "Introduction paragraph...", type: "text" },
          { key: "date", value: "2025-11-20", type: "text" },
          { key: "image_url", type: "file", src: [] },
        ],
        success: { code: 201, body: { _id: "{{introId}}" } },
      }
    ),
    homeJson("Get Intro", "Public.", "GET", "/getIntro", {
      success: { code: 200, body: [] },
    }),
    homeJson("Update Intro", "Admin/user.", "POST", "/updateIntro/:introId", {
      pathVars: { introId: "{{introId}}" },
      auth: true,
      formdata: [
        { key: "title", value: "About ALF Updated", type: "text" },
        { key: "description", value: "Updated intro...", type: "text" },
        { key: "date", value: "2025-11-20", type: "text" },
        { key: "image_url", type: "file", src: [] },
      ],
      success: { code: 201, body: { _id: "{{introId}}" } },
    }),
    homeJson("Delete Intro", "Admin.", "DELETE", "/deleteIntro/:introId", {
      pathVars: { introId: "{{introId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Intro deleted successfully" } },
    }),
    homeJson("Add Contact Info", "Admin.", "POST", "/addContactInfo", {
      auth: true,
      admin: true,
      body: {
        officeAddress: "Directorate of Information, Itanagar",
        eventVenue: "IG Park, Itanagar",
        email: "contact@litfest.arunachal.gov.in",
        emailLink: "mailto:contact@litfest.arunachal.gov.in",
      },
      success: { code: 201, body: { _id: "{{contactInfoId}}" } },
    }),
    homeJson("Get Contact Info", "Public.", "GET", "/getContactInfo", {
      success: { code: 200, body: [] },
    }),
    homeJson("Update Contact Info", "Admin/user.", "POST", "/updateContactInfo/:contactInfoId", {
      pathVars: { contactInfoId: "{{contactInfoId}}" },
      auth: true,
      body: {
        officeAddress: "Updated Office Address",
        eventVenue: "Updated Venue",
        email: "contact@litfest.arunachal.gov.in",
        emailLink: "mailto:contact@litfest.arunachal.gov.in",
      },
      success: { code: 200, body: { _id: "{{contactInfoId}}" } },
    }),
    homeJson("Delete Contact Info", "Admin.", "DELETE", "/deleteContactInfo/:contactInfoId", {
      pathVars: { contactInfoId: "{{contactInfoId}}" },
      auth: true,
      admin: true,
      success: {
        code: 200,
        body: { message: "Contact information deleted successfully" },
      },
    }),
  ],
});

folders.push({
  name: "Video Blog",
  description: "YouTube and uploaded video blogs",
  item: [
    item({
      name: "Add Video Blog (YouTube)",
      description: "Admin. videoType=youtube. multipart fields.",
      method: "POST",
      path: "/videoBlog/addVideoBlog",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Festival Highlights", type: "text" },
        { key: "videoType", value: "youtube", type: "text" },
        { key: "addedAt", value: "2025-11-20", type: "text" },
        {
          key: "youtubeUrl",
          value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          type: "text",
        },
      ],
      success: {
        code: 201,
        body: { _id: "{{videoId}}", title: "Festival Highlights", videoType: "youtube" },
      },
    }),
    item({
      name: "Add Video Blog (Raw Video)",
      description: "Admin. videoType=video. Requires video + thumbnail files.",
      method: "POST",
      path: "/videoBlog/addVideoBlog",
      auth: true,
      admin: true,
      formdata: [
        { key: "title", value: "Day 1 Recap", type: "text" },
        { key: "videoType", value: "video", type: "text" },
        { key: "addedAt", value: "2025-11-20", type: "text" },
        { key: "video", type: "file", src: [] },
        { key: "thumbnail", type: "file", src: [] },
      ],
      success: {
        code: 201,
        body: { _id: "{{videoId}}", title: "Day 1 Recap", videoType: "video" },
      },
    }),
    item({
      name: "Get All Video Blogs",
      description: "Public.",
      method: "GET",
      path: "/videoBlog/getVideoBlog",
      success: { code: 200, body: [] },
    }),
    item({
      name: "Get YouTube Videos",
      description: "Public. Filter videoType=youtube.",
      method: "GET",
      path: "/videoBlog/getYoutubeVideo",
      success: { code: 200, body: [] },
    }),
    item({
      name: "Get Raw Videos",
      description: "Public. Filter videoType=video.",
      method: "GET",
      path: "/videoBlog/getRawVideo",
      success: { code: 200, body: [] },
    }),
    item({
      name: "Get Raw Video By ID",
      description: "Public. Only if videoType=video.",
      method: "GET",
      path: "/videoBlog/getRawVideoById/:videoId",
      pathVars: { videoId: "{{videoId}}" },
      success: { code: 200, body: { _id: "{{videoId}}", videoType: "video" } },
    }),
    item({
      name: "Get Video By ID",
      description: "Public. Any video blog by ID.",
      method: "GET",
      path: "/videoBlog/getVideoById/:videoId",
      pathVars: { videoId: "{{videoId}}" },
      success: { code: 200, body: { _id: "{{videoId}}" } },
    }),
    item({
      name: "Update Video Blog",
      description: "Admin/user. Update youtube or video (+ optional files).",
      method: "POST",
      path: "/videoBlog/updateVideo/:videoId",
      pathVars: { videoId: "{{videoId}}" },
      auth: true,
      formdata: [
        { key: "title", value: "Updated Title", type: "text" },
        { key: "videoType", value: "youtube", type: "text" },
        { key: "addedAt", value: "2025-11-21", type: "text" },
        {
          key: "youtubeUrl",
          value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          type: "text",
        },
        { key: "video", type: "file", src: [] },
        { key: "thumbnail", type: "file", src: [] },
      ],
      success: {
        code: 200,
        body: { message: "YouTube video updated successfully", videoBlog: {} },
      },
    }),
    item({
      name: "Delete Video Blog",
      description: "Admin.",
      method: "DELETE",
      path: "/videoBlog/deleteVideo/:videoId",
      pathVars: { videoId: "{{videoId}}" },
      auth: true,
      admin: true,
      success: { code: 200, body: { message: "Video blog deleted successfully" } },
    }),
  ],
});

folders.push({
  name: "Contact (Send Mail)",
  description: "Contact form submissions",
  item: [
    item({
      name: "Submit Contact Us",
      description: "Public. Submit contact form. Required: name, email, message.",
      method: "POST",
      path: "/sendMail/contactUsMail",
      body: {
        name: "John Visitor",
        email: "john@example.com",
        phone: "+91-9876543210",
        message: "I would like more information about the festival.",
      },
      success: {
        code: 201,
        body: {
          success: true,
          message: "Contact form submitted successfully",
          data: { _id: "{{contactMessageId}}" },
        },
      },
    }),
    item({
      name: "Get All Contact Messages",
      description: "List all contact messages.",
      method: "GET",
      path: "/sendMail/getAllContactMessages",
      success: {
        code: 200,
        body: {
          success: true,
          message: "All contact messages fetched successfully",
          data: [],
        },
      },
    }),
    item({
      name: "Delete Contact Message",
      description: "Delete contact message by ID.",
      method: "DELETE",
      path: "/sendMail/deleteContactMessage/:id",
      pathVars: { id: "{{contactMessageId}}" },
      success: {
        code: 200,
        body: { success: true, message: "Contact message deleted successfully" },
      },
    }),
  ],
});

folders.push({
  name: "Uploads (Static Files)",
  description: "Static file serving and video streaming under /api/v1/uploads",
  item: [
    item({
      name: "Stream Video File",
      description: "GET video with Range support. Path: VideoBlog/videos/:filename",
      method: "GET",
      path: "/uploads/VideoBlog/videos/:filename",
      pathVars: { filename: "{{videoFilename}}" },
      success: { code: 200, body: { message: "video/mp4 binary stream" } },
    }),
    item({
      name: "Get Uploaded Thumbnail / Image",
      description:
        "Static serve any file under uploads root, e.g. VideoBlog/thumbnails/xyz.jpg",
      method: "GET",
      path: "/uploads/VideoBlog/thumbnails/:filename",
      pathVars: { filename: "{{thumbnailFilename}}" },
      success: { code: 200, body: { message: "image binary" } },
    }),
  ],
});

const collection = {
  info: {
    _postman_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Arunachal Literature Fest API",
    description:
      "Complete Postman Collection v2.1 for the Arunachal Literature Festival backend (Node.js/Express).\n\n**Base path:** `/api/v1`\n\n**Auth:** JWT via `Authorization: Bearer {{token}}` or httpOnly cookie `token`.\n\n**Workflow:**\n1. GET `/api/v1/captcha/generate`\n2. POST `/api/v1/onboarding/login` (saves `token` collection variable from Set-Cookie)\n3. Call protected endpoints with Bearer {{token}}\n\n**Note:** Server default PORT is `7642` if env PORT is unset; set `baseUrl` accordingly (default http://localhost:5000).",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{token}}", type: "string" }],
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000", type: "string" },
    { key: "token", value: "", type: "string" },
    { key: "captchaId", value: "", type: "string" },
    { key: "userId", value: "", type: "string" },
    { key: "eventId", value: "", type: "string" },
    { key: "eventDayId", value: "", type: "string" },
    { key: "timeId", value: "", type: "string" },
    { key: "brochureId", value: "", type: "string" },
    { key: "yearId", value: "", type: "string" },
    { key: "speakerId", value: "", type: "string" },
    { key: "workshopId", value: "", type: "string" },
    { key: "archiveYearId", value: "", type: "string" },
    { key: "archiveDayId", value: "", type: "string" },
    { key: "imageId", value: "", type: "string" },
    { key: "categoryId", value: "", type: "string" },
    { key: "newsAndBlogId", value: "", type: "string" },
    { key: "blogId", value: "", type: "string" },
    { key: "bannerId", value: "", type: "string" },
    { key: "bannerTextId", value: "", type: "string" },
    { key: "buttonId", value: "", type: "string" },
    { key: "poetryId", value: "", type: "string" },
    { key: "testimonialId", value: "", type: "string" },
    { key: "introId", value: "", type: "string" },
    { key: "contactInfoId", value: "", type: "string" },
    { key: "videoId", value: "", type: "string" },
    { key: "contactMessageId", value: "", type: "string" },
    { key: "videoFilename", value: "sample.mp4", type: "string" },
    { key: "thumbnailFilename", value: "sample.jpg", type: "string" },
  ],
  item: folders,
};

function fixUrls(items) {
  for (const it of items) {
    if (it.item) fixUrls(it.item);
    if (it.request?.url) {
      const u = it.request.url;
      if (u.variable) {
        for (const v of u.variable) {
          u.raw = u.raw.replace(`:${v.key}`, `{{${v.key}}}`);
          u.path = u.path.map((p) => (p === `:${v.key}` ? `{{${v.key}}}` : p));
        }
      }
    }
  }
}
fixUrls(collection.item);

const outPath = path.join(__dirname, "..", "..", "Arunachal_Literature_Fest_API.postman_collection.json");
fs.writeFileSync(outPath, JSON.stringify(collection, null, 2));

const count = (items) => items.reduce((n, i) => n + (i.item ? count(i.item) : 1), 0);
console.log("Wrote:", outPath);
console.log("Folders:", collection.item.length);
console.log("Requests:", count(collection.item));

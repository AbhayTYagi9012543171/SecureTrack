# Architecture

- `frontend`: React/Vite SPA, React Router, Axios, React Hook Form/Zod, Recharts, Framer Motion and Tailwind.
- `backend`: Express REST API under `/api/v1`; Mongoose persistence; cookie JWT authentication; ownership checks; central error handling.
- `services/monitoring`: safe passive HTTP/TLS checks. Scan result records are only marked completed after checks return.
- Multi-tenant boundary: resources are queried with `owner` set to authenticated user in this initial single-user organization model. Team membership is represented by models but invitations are not exposed as complete workflow.

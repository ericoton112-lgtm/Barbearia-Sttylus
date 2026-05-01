
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** sttylus
- **Date:** 2026-05-01
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Client books an appointment from service selection through confirmation
- **Test Code:** [TC001_Client_books_an_appointment_from_service_selection_through_confirmation.py](./TC001_Client_books_an_appointment_from_service_selection_through_confirmation.py)
- **Test Error:** TEST BLOCKED

The client booking flow could not be reached — the app remains in professional mode and switching to client view or logging in as a client did not produce the client dashboard.

Observations:
- The page shows the professional dashboard at /professional-dashboard with professional controls visible.
- Role-toggle clicks and multiple client login attempts did not switch the UI to the client view.
- Clicking 'Serviços' from this session did not surface a client booking interface.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/f94f93e7-14f6-4976-8015-0049a5e4186a
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Existing client logs in and is routed to client area
- **Test Code:** [TC002_Existing_client_logs_in_and_is_routed_to_client_area.py](./TC002_Existing_client_logs_in_and_is_routed_to_client_area.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/29c772c1-0a95-4ddb-9372-7d11b8abb483
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Client signs up without invite code and lands in client area
- **Test Code:** [TC003_Client_signs_up_without_invite_code_and_lands_in_client_area.py](./TC003_Client_signs_up_without_invite_code_and_lands_in_client_area.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/9911aacf-7591-47ce-ba90-878fc2dca1d6
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 User signs up with invite code and lands in professional dashboard
- **Test Code:** [TC004_User_signs_up_with_invite_code_and_lands_in_professional_dashboard.py](./TC004_User_signs_up_with_invite_code_and_lands_in_professional_dashboard.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/e515d5eb-e7cb-4841-b9cd-651f343fdf7f
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Protected route redirects unauthenticated user to login
- **Test Code:** [TC005_Protected_route_redirects_unauthenticated_user_to_login.py](./TC005_Protected_route_redirects_unauthenticated_user_to_login.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/cc2c117b-1f1c-4755-b6ae-aaa6ed7ff1c3
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Client books an appointment starting from barber selection
- **Test Code:** [TC006_Client_books_an_appointment_starting_from_barber_selection.py](./TC006_Client_books_an_appointment_starting_from_barber_selection.py)
- **Test Error:** TEST BLOCKED

The client booking flow cannot proceed because no barbers are available to select.

Observations:
- The 'Escolha o Profissional' page shows the message 'Nenhum barbeiro disponível no momento.'
- The page only contains navigation links and no clickable professional cards or items to start scheduling.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/82b18364-3a6c-4e76-a922-f22b76cdc1ae
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Session persists after refresh for authenticated user
- **Test Code:** [TC007_Session_persists_after_refresh_for_authenticated_user.py](./TC007_Session_persists_after_refresh_for_authenticated_user.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/d9dbd420-454b-4420-9755-767cfdc4fb4d
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Professional dashboard loads today’s summary and next client information
- **Test Code:** [TC008_Professional_dashboard_loads_todays_summary_and_next_client_information.py](./TC008_Professional_dashboard_loads_todays_summary_and_next_client_information.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/0fe252a0-d013-48a9-a4f0-abb9bd0fdc07
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 View schedule by date and conclude an appointment
- **Test Code:** [TC009_View_schedule_by_date_and_conclude_an_appointment.py](./TC009_View_schedule_by_date_and_conclude_an_appointment.py)
- **Test Error:** TEST BLOCKED

There are no appointments available to perform the conclude operation, and the UI does not provide a way to create a test appointment as the barber.

Observations:
- The Agenda page displays 'Nenhum agendamento para este dia.' for the currently selected date.
- I selected multiple dates (Ter 28, Sex 1, Seg 11, Ter 12, Qua 13, Ter 5) and none showed any appointments.
- There is no apparent control on this page to create a new appointment for testing as the professional.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/a59e8b1c-eec2-47fc-9595-6995f729cbaf
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Professional toggles accepting appointments on the dashboard
- **Test Code:** [TC010_Professional_toggles_accepting_appointments_on_the_dashboard.py](./TC010_Professional_toggles_accepting_appointments_on_the_dashboard.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/a3511a5c-6e80-420a-a9c8-972ac31fbc7a
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Cancel an appointment from agenda
- **Test Code:** [TC011_Cancel_an_appointment_from_agenda.py](./TC011_Cancel_an_appointment_from_agenda.py)
- **Test Error:** TEST BLOCKED

There are no appointments in the professional agenda to open and cancel.

Observations:
- The dashboard shows 'Agenda livre o dia todo.' indicating the schedule is empty.
- The dashboard displays 'Agendamentos 00' (00 marked for today).
- No appointment items are present on the page to open a detail view.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/17714c12-cdae-4db6-b9d3-65aa5a72849d
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Professional marks the next appointment as completed
- **Test Code:** [TC012_Professional_marks_the_next_appointment_as_completed.py](./TC012_Professional_marks_the_next_appointment_as_completed.py)
- **Test Error:** TEST BLOCKED

The test could not be completed because there are no appointments available to check in and complete.

Observations:
- The Agenda page shows 'Nenhum agendamento para este dia.' for the selected dates.
- I checked these dates: Sáb 2 Maio, Dom 10 Maio, Seg 11 Maio, Ter 12 Maio, Qua 13 Maio.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/8dd5bd3e-3221-40bf-9e52-ab4cd77c9ef2
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Update professional profile and toggle availability
- **Test Code:** [TC013_Update_professional_profile_and_toggle_availability.py](./TC013_Update_professional_profile_and_toggle_availability.py)
- **Test Error:** TEST FAILURE

The profile page does not expose the "accepting appointments" toggle so I could not verify updating/saving the availability state.

Observations:
- The profile page shows 'Nome Completo' and 'Telefone' inputs and a 'Salvar Alterações' button.
- No control for "accepting appointments" or availability state is present on the page after scrolling.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/0aa55adf-db2a-424b-bada-cfee1e2a8a6c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Create a new service
- **Test Code:** [TC014_Create_a_new_service.py](./TC014_Create_a_new_service.py)
- **Test Error:** TEST FAILURE

Creating a new service failed because the app prevented saving and the created service does not appear in the services list.

Observations:
- The modal shows the error message: 'Erro: perfil do usuário não carregado. Recarregue a página.'
- After clicking 'Salvar Serviço', the services page still shows 'Você ainda não tem serviços cadastrados.'
- The 'Novo Serviço' modal remained open with the filled fields, indicating the save did not complete.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/43c7447d-6439-4200-9a46-d8adbffc3b1d
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Edit an existing service
- **Test Code:** [TC015_Edit_an_existing_service.py](./TC015_Edit_an_existing_service.py)
- **Test Error:** TEST FAILURE

Editing a service did not persist — saving changes did not update the services list.

Observations:
- After multiple save attempts the services list still shows the original name 'Corte'.
- Reopening the edit modal after saving shows the original values (the edit did not persist).
- The UI indicated a save (e.g. 'Salvando...') but no change appeared in the list.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/80c75534-aa18-44b8-9af8-f1aaba2fd91c/2e51ad9e-ec7c-4ef6-9ba7-08c274064bd9
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **46.67** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---
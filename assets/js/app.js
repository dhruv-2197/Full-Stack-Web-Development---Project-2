/**
 * Main Application Logic for Healthcare & Doctor Appointment System (Multi-Page HTML)
 * Supports index.html (Live Queue), doctors.html (Directory & Booking), and appointments.html (Register).
 */

const STANDARD_SLOTS = [
  "09:00 AM", "10:00 AM", "11:00 AM", "11:45 AM",
  "02:00 PM", "03:00 PM", "04:00 PM", "04:45 PM"
];

$(document).ready(async function () {
  let currentDeleteId = null;

  // Check server connection silently
  await API.checkServer();

  // Load initial content based on presence on page
  await refreshAllViews();

  async function refreshAllViews() {
    if ($('#statTotalAppts').length) await loadMetrics();
    if ($('#queueWaitingContainer').length) await renderQueueBoard();
    if ($('#doctorsContainer').length) await renderDoctors();
    if ($('#appointmentsTableBody').length) await renderAppointmentsTable();
    if ($('#apptDoctorSelect').length) await populateDoctorSelect();
  }

  // ---------------- METRICS ----------------
  async function loadMetrics() {
    const appointments = await API.getAppointments();
    const doctors = await API.getDoctors();

    $('#statTotalAppts').text(appointments.length);
    const consulting = appointments.filter(a => a.status === 'In Consultation').length;
    $('#statConsultingAppts').text(consulting);
    const completed = appointments.filter(a => a.status === 'Completed').length;
    $('#statCompletedAppts').text(completed);
    $('#statTotalDoctors').text(doctors.length);
  }

  // ---------------- LIVE OPD QUEUE BOARD ----------------
  async function renderQueueBoard() {
    const $waitBox = $('#queueWaitingContainer');
    if (!$waitBox.length) return;

    const appointments = await API.getAppointments();
    const waiting = appointments.filter(a => a.status === 'Confirmed');
    const consulting = appointments.filter(a => a.status === 'In Consultation');
    const completed = appointments.filter(a => a.status === 'Completed');

    $('#badgeQueueWaitingCount').text(waiting.length);
    $('#badgeQueueConsultingCount').text(consulting.length);
    $('#badgeQueueCompletedCount').text(completed.length);

    // 1. Render Waiting Container
    $waitBox.empty();
    if (waiting.length === 0) {
      $waitBox.html('<div class="text-center text-muted py-4 small"><i class="bi bi-inbox fs-3 d-block mb-1"></i>Queue is clear</div>');
    } else {
      waiting.forEach(a => {
        $waitBox.append(`
          <div class="queue-card border-confirmed">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="token-badge">${a.tokenNo || 'OPD-00'}</span>
              <span class="status-pill-confirmed"><i class="bi bi-clock me-1"></i>${a.timeSlot}</span>
            </div>
            <h6 class="fw-bold mb-1 text-dark">${a.patientName}</h6>
            <div class="small text-muted mb-2"><i class="bi bi-person-heart text-teal me-1"></i>${a.doctorName} (${a.roomNo || 'OPD Room'})</div>
            <div class="d-flex justify-content-between align-items-center pt-2 border-top">
              <button class="btn btn-sm btn-outline-primary btn-action advance-consult-btn" data-id="${a.id}">
                <i class="bi bi-telephone-outbound me-1"></i> Call In
              </button>
              <button class="btn btn-sm btn-light btn-action view-slip-btn" data-id="${a.id}">
                <i class="bi bi-receipt"></i> Slip
              </button>
            </div>
          </div>
        `);
      });
    }

    // 2. Render In-Consultation Container
    const $consultBox = $('#queueConsultingContainer').empty();
    if (consulting.length === 0) {
      $consultBox.html('<div class="text-center text-muted py-4 small"><i class="bi bi-person-video2 fs-3 d-block mb-1"></i>No active consultations</div>');
    } else {
      consulting.forEach(a => {
        $consultBox.append(`
          <div class="queue-card border-consulting">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="token-badge bg-primary text-white border-0">${a.tokenNo || 'OPD-00'}</span>
              <span class="status-pill-consulting"><i class="bi bi-activity me-1"></i>In Room</span>
            </div>
            <h6 class="fw-bold mb-1 text-dark">${a.patientName}</h6>
            <div class="small text-muted mb-2"><i class="bi bi-door-open-fill text-primary me-1"></i>${a.roomNo} | ${a.doctorName}</div>
            <div class="d-flex justify-content-between align-items-center pt-2 border-top">
              <button class="btn btn-sm btn-success btn-action open-notes-btn" data-id="${a.id}" data-patient="${a.patientName}" data-token="${a.tokenNo}" data-doctor="${a.doctorName}">
                <i class="bi bi-check2-circle me-1"></i> Finish & Prescribe
              </button>
              <button class="btn btn-sm btn-light btn-action view-slip-btn" data-id="${a.id}">
                <i class="bi bi-receipt"></i>
              </button>
            </div>
          </div>
        `);
      });
    }

    // 3. Render Completed Container
    const $completedBox = $('#queueCompletedContainer').empty();
    if (completed.length === 0) {
      $completedBox.html('<div class="text-center text-muted py-4 small"><i class="bi bi-check-circle fs-3 d-block mb-1"></i>No completed visits today</div>');
    } else {
      completed.forEach(a => {
        $completedBox.append(`
          <div class="queue-card border-completed">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="token-badge">${a.tokenNo || 'OPD-00'}</span>
              <span class="status-pill-completed"><i class="bi bi-check-all me-1"></i>Completed</span>
            </div>
            <h6 class="fw-bold mb-1 text-dark">${a.patientName}</h6>
            <div class="small text-muted mb-2"><i class="bi bi-person-check text-success me-1"></i>${a.doctorName}</div>
            ${a.notes ? `<p class="small text-muted bg-white p-2 rounded border mb-2 fst-italic">"${a.notes.substring(0, 50)}..."</p>` : ''}
            <div class="d-flex justify-content-end pt-2 border-top">
              <button class="btn btn-sm btn-outline-success btn-action view-slip-btn" data-id="${a.id}">
                <i class="bi bi-file-earmark-medical me-1"></i> View Prescription
              </button>
            </div>
          </div>
        `);
      });
    }
  }

  // ---------------- SPECIALIST DIRECTORY ----------------
  async function renderDoctors() {
    const $container = $('#doctorsContainer');
    if (!$container.length) return;
    const doctors = await API.getDoctors();
    $container.empty();

    doctors.forEach(doc => {
      const card = `
        <div class="col-12 col-md-6 col-lg-3">
          <div class="doctor-card h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="doctor-avatar">${doc.name.replace('Dr. ', '').charAt(0)}</div>
                <div>
                  <h6 class="fw-bold mb-0 text-dark">${doc.name}</h6>
                  <span class="badge bg-teal-subtle text-teal small fw-semibold">${doc.specialization}</span>
                </div>
              </div>
              <p class="small text-muted mb-1"><i class="bi bi-hospital me-1"></i> ${doc.department}</p>
              <p class="small text-muted mb-1"><i class="bi bi-geo-alt me-1"></i> Room: ${doc.roomNo}</p>
              <p class="small text-muted mb-1"><i class="bi bi-calendar-week me-1"></i> Days: ${doc.availableDays || 'Mon - Fri'}</p>
              <p class="small text-muted mb-2"><i class="bi bi-star-fill text-warning me-1"></i> Rating: ${doc.rating || '4.8'} (${doc.experience})</p>
            </div>
            <div class="border-top pt-3 mt-2 d-flex justify-content-between align-items-center">
              <div>
                <span class="text-muted d-block small">OPD Fee</span>
                <span class="fw-bold text-dark fs-6">₹${doc.consultingFee}</span>
              </div>
              <button class="btn btn-sm btn-teal btn-action direct-book-btn" data-docname="${doc.name}" data-spec="${doc.specialization}" data-room="${doc.roomNo}">
                <i class="bi bi-calendar-plus me-1"></i> Book Slot
              </button>
            </div>
          </div>
        </div>
      `;
      $container.append(card);
    });
  }

  // ---------------- MASTER APPOINTMENTS TABLE ----------------
  async function renderAppointmentsTable(searchQuery = '', statusFilter = '') {
    const $tbody = $('#appointmentsTableBody');
    if (!$tbody.length) return;
    const appointments = await API.getAppointments();
    $tbody.empty();

    const filtered = appointments.filter(a => {
      const matchText = (a.patientName + a.patientEmail + a.patientPhone + a.doctorName + (a.tokenNo || ''))
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter ? a.status === statusFilter : true;
      return matchText && matchStatus;
    });

    if (filtered.length === 0) {
      $tbody.html(`
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            <i class="bi bi-calendar-x fs-2 d-block mb-2 text-secondary"></i>
            No appointment records found matching the filter criteria.
          </td>
        </tr>
      `);
      return;
    }

    filtered.forEach(appt => {
      let statusBadge = '';
      if (appt.status === 'Confirmed') {
        statusBadge = '<span class="status-pill-confirmed"><i class="bi bi-check-circle-fill me-1"></i>Confirmed</span>';
      } else if (appt.status === 'In Consultation') {
        statusBadge = '<span class="status-pill-consulting"><i class="bi bi-person-video2 me-1"></i>In Consultation</span>';
      } else if (appt.status === 'Completed') {
        statusBadge = '<span class="status-pill-completed"><i class="bi bi-patch-check-fill me-1"></i>Completed</span>';
      } else {
        statusBadge = '<span class="status-pill-cancelled"><i class="bi bi-x-circle-fill me-1"></i>Cancelled</span>';
      }

      const row = `
        <tr>
          <td><span class="token-badge">${appt.tokenNo || 'OPD-00'}</span></td>
          <td>
            <div class="fw-bold text-dark">${appt.patientName}</div>
            <small class="text-muted"><i class="bi bi-telephone-fill me-1"></i>${appt.patientPhone}</small>
          </td>
          <td>
            <div class="fw-semibold text-dark">${appt.doctorName}</div>
            <small class="text-muted">${appt.specialization} (${appt.roomNo || 'OPD'})</small>
          </td>
          <td>
            <div><i class="bi bi-calendar3 me-1 text-muted"></i>${appt.appointmentDate}</div>
            <small class="text-muted"><i class="bi bi-clock me-1"></i>${appt.timeSlot}</small>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div class="d-flex gap-1">
              <button class="btn btn-sm btn-outline-primary btn-action edit-appt-btn" data-id="${appt.id}" title="Edit / Reschedule">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button class="btn btn-sm btn-outline-secondary btn-action view-slip-btn" data-id="${appt.id}" title="View OPD Slip">
                <i class="bi bi-receipt"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger btn-action delete-appt-btn" data-id="${appt.id}" data-name="${appt.patientName}" title="Cancel Booking">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
      $tbody.append(row);
    });
  }

  // Populate doctor select dropdown
  async function populateDoctorSelect() {
    const $select = $('#apptDoctorSelect');
    if (!$select.length) return;
    const doctors = await API.getDoctors();
    $select.empty().append('<option value="">-- Choose Specialist Doctor --</option>');
    doctors.forEach(doc => {
      $select.append(`
        <option value="${doc.name}" data-spec="${doc.specialization}" data-room="${doc.roomNo}">
          ${doc.name} (${doc.specialization} - Room ${doc.roomNo})
        </option>
      `);
    });
  }

  // ---------------- INTERACTIVE TIME SLOT CHIP SELECTOR ----------------
  async function renderSlotChips(selectedDoctor, selectedDate, currentSlot = '') {
    const $container = $('#slotChipsContainer');
    if (!$container.length) return;
    $container.empty();
    $('#slotErrorFeedback').addClass('d-none');

    if (!selectedDoctor || !selectedDate) {
      $container.html('<div class="text-muted small">Please select a doctor and appointment date to check available slots.</div>');
      $('#slotStatusHelp').text('Choose doctor & date');
      return;
    }

    const appointments = await API.getAppointments();
    const currentId = $('#appointmentId').val();
    const bookedSlots = appointments
      .filter(a => a.doctorName === selectedDoctor && a.appointmentDate === selectedDate && String(a.id) !== String(currentId) && a.status !== 'Cancelled')
      .map(a => a.timeSlot);

    $('#slotStatusHelp').text(`${bookedSlots.length} slot(s) already booked`);

    STANDARD_SLOTS.forEach(slot => {
      const isBooked = bookedSlots.includes(slot);
      const isCurrentSelected = slot === currentSlot;

      if (isBooked) {
        $container.append(`
          <div class="slot-chip disabled" title="Already booked by another patient">
            ${slot} <small>(Booked)</small>
          </div>
        `);
      } else {
        const selectedClass = isCurrentSelected ? 'selected' : '';
        $container.append(`
          <div class="slot-chip ${selectedClass}" data-slot="${slot}">
            ${slot}
          </div>
        `);
      }
    });

    if (currentSlot && !bookedSlots.includes(currentSlot)) {
      $('#apptTimeSlot').val(currentSlot);
    }
  }

  // Doctor or Date change handler
  $('#apptDoctorSelect, #appointmentDate').on('change', function () {
    const docName = $('#apptDoctorSelect').val();
    const date = $('#appointmentDate').val();
    const opt = $('#apptDoctorSelect').find('option:selected');
    $('#apptSpecialization').val(opt.data('spec') || '');
    $('#apptRoomNo').val(opt.data('room') || 'OPD-101');
    renderSlotChips(docName, date, $('#apptTimeSlot').val());
  });

  // Clicking a slot chip
  $(document).on('click', '.slot-chip:not(.disabled)', function () {
    $('.slot-chip').removeClass('selected');
    $(this).addClass('selected');
    const slot = $(this).data('slot');
    $('#apptTimeSlot').val(slot);
    $('#slotErrorFeedback').addClass('d-none');
  });

  // Direct Book from Doctor Card
  $(document).on('click', '.direct-book-btn', async function () {
    const docName = $(this).data('docname');
    const spec = $(this).data('spec');
    const room = $(this).data('room');

    resetApptForm();
    $('#appointmentModalTitle').text(`Book Appointment with ${docName}`);
    await populateDoctorSelect();
    $('#apptDoctorSelect').val(docName);
    $('#apptSpecialization').val(spec);
    $('#apptRoomNo').val(room);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    $('#appointmentDate').val(dateStr);

    await renderSlotChips(docName, dateStr);
    new bootstrap.Modal(document.getElementById('appointmentModal')).show();
  });

  // Generic Book Button
  $('#btnOpenBookModal, #btnQuickBookQueue').on('click', async function () {
    resetApptForm();
    $('#appointmentModalTitle').text('Book Patient Appointment');
    await populateDoctorSelect();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    $('#appointmentDate').val(tomorrow.toISOString().split('T')[0]);
    await renderSlotChips('', '');
    new bootstrap.Modal(document.getElementById('appointmentModal')).show();
  });

  function resetApptForm() {
    const form = document.getElementById('appointmentForm');
    if (form) form.reset();
    $('#appointmentId').val('');
    $('#apptTimeSlot').val('');
    $('#appointmentForm').removeClass('was-validated');
    $('#slotErrorFeedback').addClass('d-none');
  }

  // Edit / Reschedule
  $(document).on('click', '.edit-appt-btn', async function () {
    const id = $(this).data('id');
    const appointments = await API.getAppointments();
    const appt = appointments.find(a => String(a.id) === String(id));

    if (appt) {
      $('#appointmentModalTitle').text(`Modify / Reschedule Token ${appt.tokenNo}`);
      $('#appointmentId').val(appt.id);
      $('#patientName').val(appt.patientName);
      $('#patientPhone').val(appt.patientPhone);
      $('#patientEmail').val(appt.patientEmail);
      await populateDoctorSelect();
      $('#apptDoctorSelect').val(appt.doctorName);
      $('#apptSpecialization').val(appt.specialization);
      $('#apptRoomNo').val(appt.roomNo);
      $('#appointmentDate').val(appt.appointmentDate);
      $('#apptTimeSlot').val(appt.timeSlot);
      $('#appointmentStatus').val(appt.status);
      $('#apptNotes').val(appt.notes || '');

      await renderSlotChips(appt.doctorName, appt.appointmentDate, appt.timeSlot);
      new bootstrap.Modal(document.getElementById('appointmentModal')).show();
    }
  });

  // Save / Update Appointment
  $('#appointmentForm').on('submit', async function (e) {
    e.preventDefault();
    const form = this;

    const timeSlot = $('#apptTimeSlot').val();
    if (!timeSlot) {
      $('#slotErrorFeedback').removeClass('d-none');
    }

    if (!form.checkValidity() || !timeSlot) {
      e.stopPropagation();
      $(form).addClass('was-validated');
      return;
    }

    const id = $('#appointmentId').val();
    const appointments = await API.getAppointments();
    const generatedToken = id 
      ? (appointments.find(a => String(a.id) === String(id))?.tokenNo || `OPD-${100 + appointments.length}`)
      : `OPD-${101 + appointments.length}`;

    const appointmentData = {
      tokenNo: generatedToken,
      patientName: $('#patientName').val().trim(),
      patientPhone: $('#patientPhone').val().trim(),
      patientEmail: $('#patientEmail').val().trim(),
      doctorName: $('#apptDoctorSelect').val(),
      specialization: $('#apptSpecialization').val(),
      roomNo: $('#apptRoomNo').val() || 'OPD-101',
      appointmentDate: $('#appointmentDate').val(),
      timeSlot: timeSlot,
      status: $('#appointmentStatus').val(),
      notes: $('#apptNotes').val().trim()
    };

    try {
      if (id) {
        await API.updateAppointment(id, appointmentData);
        showToast('Appointment updated successfully!', 'success');
      } else {
        await API.addAppointment(appointmentData);
        showToast(`Appointment confirmed! Token ${generatedToken} generated.`, 'success');
      }
      bootstrap.Modal.getInstance(document.getElementById('appointmentModal')).hide();
      await refreshAllViews();
    } catch (err) {
      showToast('Error saving appointment.', 'danger');
    }
  });

  // 1-Click Queue advance
  $(document).on('click', '.advance-consult-btn', async function () {
    const id = $(this).data('id');
    const appointments = await API.getAppointments();
    const appt = appointments.find(a => String(a.id) === String(id));
    if (appt) {
      appt.status = 'In Consultation';
      await API.updateAppointment(id, appt);
      showToast(`${appt.patientName} called into ${appt.roomNo}!`, 'primary');
      await refreshAllViews();
    }
  });

  // Open Prescription / Notes Modal
  $(document).on('click', '.open-notes-btn', function () {
    const id = $(this).data('id');
    const patient = $(this).data('patient');
    const token = $(this).data('token');
    const doctor = $(this).data('doctor');

    $('#notesApptId').val(id);
    $('#notesPatientName').text(patient);
    $('#notesTokenNo').text(token);
    $('#notesDoctorName').text(doctor);
    $('#modalPrescriptionText').val('');

    new bootstrap.Modal(document.getElementById('notesModal')).show();
  });

  // Save Prescription and mark Completed
  $('#notesForm').on('submit', async function (e) {
    e.preventDefault();
    const id = $('#notesApptId').val();
    const notesText = $('#modalPrescriptionText').val().trim();

    const appointments = await API.getAppointments();
    const appt = appointments.find(a => String(a.id) === String(id));
    if (appt) {
      appt.status = 'Completed';
      appt.notes = notesText;
      await API.updateAppointment(id, appt);
      showToast(`Consultation completed for Token ${appt.tokenNo}!`, 'success');
      bootstrap.Modal.getInstance(document.getElementById('notesModal')).hide();
      await refreshAllViews();
    }
  });

  // View OPD Slip
  $(document).on('click', '.view-slip-btn', async function () {
    const id = $(this).data('id');
    const appointments = await API.getAppointments();
    const appt = appointments.find(a => String(a.id) === String(id));

    if (appt) {
      $('#slipTokenNo').text(appt.tokenNo || 'OPD-00');
      $('#slipPatient').text(appt.patientName);
      $('#slipPhone').text(appt.patientPhone);
      $('#slipDoctor').text(appt.doctorName);
      $('#slipRoom').text(`${appt.specialization} (${appt.roomNo || 'OPD'})`);
      $('#slipDate').text(appt.appointmentDate);
      $('#slipSlot').text(appt.timeSlot);
      $('#slipNotes').text(appt.notes || 'No doctor consultation notes recorded.');

      new bootstrap.Modal(document.getElementById('opdSlipModal')).show();
    }
  });

  // Cancel / Delete Modal
  $(document).on('click', '.delete-appt-btn', function () {
    currentDeleteId = $(this).data('id');
    const name = $(this).data('name');
    $('#deleteModalPatientName').text(name);
    new bootstrap.Modal(document.getElementById('confirmDeleteModal')).show();
  });

  $('#btnConfirmDelete').on('click', async function () {
    try {
      await API.deleteAppointment(currentDeleteId);
      showToast('Appointment record cancelled.', 'success');
      bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal')).hide();
      await refreshAllViews();
    } catch (err) {
      showToast('Failed to cancel appointment.', 'danger');
    }
  });

  // Search & Filter
  $('#searchApptInput, #filterStatusSelect').on('input change', function () {
    const q = $('#searchApptInput').val();
    const s = $('#filterStatusSelect').val();
    renderAppointmentsTable(q, s);
  });

  // Toast
  function showToast(msg, type = 'info') {
    const $toast = $('#careToast');
    const $msg = $('#careToastMsg');
    if (!$toast.length) return;
    $toast.removeClass('bg-success bg-danger bg-teal bg-primary text-white');

    if (type === 'success') $toast.addClass('bg-success text-white');
    else if (type === 'danger') $toast.addClass('bg-danger text-white');
    else if (type === 'primary') $toast.addClass('bg-primary text-white');
    else $toast.addClass('bg-dark text-white');

    $msg.text(msg);
    new bootstrap.Toast(document.getElementById('careToast')).show();
  }
});

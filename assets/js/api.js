/**
 * API Service for Healthcare & Doctor Appointment System
 * Connects to JSON Server (http://localhost:3000) with automatic LocalStorage fallback.
 */

const API_BASE_URL = 'http://localhost:3000';

const SEED_DATA = {
  appointments: [
    {
      id: "1",
      tokenNo: "OPD-101",
      patientName: "Vikram Malhotra",
      patientEmail: "vikram.m@gmail.com",
      patientPhone: "+91 98765 43210",
      doctorId: "1",
      doctorName: "Dr. Priya Deshmukh",
      specialization: "Cardiology",
      roomNo: "OPD-204",
      appointmentDate: "2026-11-02",
      timeSlot: "10:30 AM",
      status: "In Consultation",
      notes: "Patient reported mild chest tightness during exertion. ECG normal, prescribed Cardivas 3.125mg."
    },
    {
      id: "2",
      tokenNo: "OPD-102",
      patientName: "Sneha Nair",
      patientEmail: "sneha.nair@outlook.com",
      patientPhone: "+91 98112 34567",
      doctorId: "2",
      doctorName: "Dr. Arvind Saxena",
      specialization: "Neurology",
      roomNo: "OPD-302",
      appointmentDate: "2026-11-03",
      timeSlot: "02:00 PM",
      status: "Confirmed",
      notes: "Follow-up consultation for recurrent migraines."
    },
    {
      id: "3",
      tokenNo: "OPD-103",
      patientName: "Karan Singhania",
      patientEmail: "karan.s@yahoo.com",
      patientPhone: "+91 94567 89012",
      doctorId: "3",
      doctorName: "Dr. Kavita Menon",
      specialization: "Pediatrics",
      roomNo: "OPD-108",
      appointmentDate: "2026-11-04",
      timeSlot: "11:15 AM",
      status: "Confirmed",
      notes: "Routine child wellness and seasonal vaccination review."
    },
    {
      id: "4",
      tokenNo: "OPD-104",
      patientName: "Sunita Agarwal",
      patientEmail: "sunita.a@gmail.com",
      patientPhone: "+91 97890 12345",
      doctorId: "4",
      doctorName: "Dr. Rajeshwar Rao",
      specialization: "Orthopedics",
      roomNo: "OPD-115",
      appointmentDate: "2026-11-01",
      timeSlot: "04:30 PM",
      status: "Completed",
      notes: "Right knee osteoarthritis follow-up. Advised physiotherapy and Calcium supplements."
    }
  ],
  doctors: [
    {
      id: "1",
      name: "Dr. Priya Deshmukh",
      specialization: "Cardiology",
      department: "Cardiovascular Sciences",
      roomNo: "OPD-204",
      experience: "12 Years",
      consultingFee: 800,
      rating: "4.9",
      availableDays: "Mon - Fri"
    },
    {
      id: "2",
      name: "Dr. Arvind Saxena",
      specialization: "Neurology",
      department: "Neurosciences",
      roomNo: "OPD-302",
      experience: "15 Years",
      consultingFee: 1000,
      rating: "4.8",
      availableDays: "Mon - Sat"
    },
    {
      id: "3",
      name: "Dr. Kavita Menon",
      specialization: "Pediatrics",
      department: "Child Healthcare",
      roomNo: "OPD-108",
      experience: "8 Years",
      consultingFee: 600,
      rating: "4.9",
      availableDays: "Tue - Sat"
    },
    {
      id: "4",
      name: "Dr. Rajeshwar Rao",
      specialization: "Orthopedics",
      department: "Bone & Joint Clinic",
      roomNo: "OPD-115",
      experience: "10 Years",
      consultingFee: 750,
      rating: "4.7",
      availableDays: "Mon - Fri"
    }
  ]
};

function initStorage() {
  if (!localStorage.getItem('p2_appointments_v2')) {
    localStorage.setItem('p2_appointments_v2', JSON.stringify(SEED_DATA.appointments));
  }
  if (!localStorage.getItem('p2_doctors_v2')) {
    localStorage.setItem('p2_doctors_v2', JSON.stringify(SEED_DATA.doctors));
  }
}
initStorage();

const API = {
  isServerActive: false,

  async checkServer() {
    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, { method: 'GET', cache: 'no-store' });
      this.isServerActive = res.ok;
    } catch (e) {
      this.isServerActive = false;
    }
    return this.isServerActive;
  },

  // ---------------- APPOINTMENTS CRUD ----------------
  async getAppointments() {
    if (this.isServerActive) {
      try {
        const res = await fetch(`${API_BASE_URL}/appointments`);
        if (!res.ok) throw new Error('Network response not ok');
        return await res.json();
      } catch (err) {
        console.warn('Falling back to localStorage for getAppointments', err);
      }
    }
    return JSON.parse(localStorage.getItem('p2_appointments_v2') || '[]');
  },

  async addAppointment(appointment) {
    if (this.isServerActive) {
      try {
        const res = await fetch(`${API_BASE_URL}/appointments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appointment)
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Falling back to localStorage for addAppointment', err);
      }
    }
    const list = JSON.parse(localStorage.getItem('p2_appointments_v2') || '[]');
    const newAppointment = { ...appointment, id: String(Date.now()) };
    list.push(newAppointment);
    localStorage.setItem('p2_appointments_v2', JSON.stringify(list));
    return newAppointment;
  },

  async updateAppointment(id, data) {
    if (this.isServerActive) {
      try {
        const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Falling back to localStorage for updateAppointment', err);
      }
    }
    const list = JSON.parse(localStorage.getItem('p2_appointments_v2') || '[]');
    const index = list.findIndex(a => String(a.id) === String(id));
    if (index !== -1) {
      list[index] = { ...data, id: String(id) };
      localStorage.setItem('p2_appointments_v2', JSON.stringify(list));
      return list[index];
    }
    throw new Error('Appointment not found');
  },

  async deleteAppointment(id) {
    if (this.isServerActive) {
      try {
        const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn('Falling back to localStorage for deleteAppointment', err);
      }
    }
    let list = JSON.parse(localStorage.getItem('p2_appointments_v2') || '[]');
    list = list.filter(a => String(a.id) !== String(id));
    localStorage.setItem('p2_appointments_v2', JSON.stringify(list));
    return true;
  },

  // ---------------- DOCTORS ----------------
  async getDoctors() {
    if (this.isServerActive) {
      try {
        const res = await fetch(`${API_BASE_URL}/doctors`);
        if (!res.ok) throw new Error('Network error');
        return await res.json();
      } catch (err) {
        console.warn('Falling back to localStorage for getDoctors', err);
      }
    }
    return JSON.parse(localStorage.getItem('p2_doctors_v2') || '[]');
  }
};

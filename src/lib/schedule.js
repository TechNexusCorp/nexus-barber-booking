// Regras de agenda da barbearia (expediente, grade e sobreposição)

export const SLOT_STEP_MINUTES = 5;

export const SHIFTS = [
  { id: 'morning', label: 'Manhã', start: '08:00', end: '12:00' },
  { id: 'afternoon', label: 'Tarde', start: '13:00', end: '19:30' },
];

export const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

export const toHHMM = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
};

export const addMinutes = (hhmm, minutes) => toHHMM(toMinutes(hhmm) + minutes);

/** Intervalos [inicio, fim) se cruzam? */
export const overlaps = (startA, endA, startB, endB) => startA < endB && endA > startB;

/**
 * Gera os horários de início de um turno, de 5 em 5 min.
 * Um horário só existe se o serviço inteiro TERMINAR dentro do turno
 * (assim o almoço 12:00–13:00 nunca é invadido).
 */
export const generateShiftSlots = (shift, durationMinutes) => {
  const start = toMinutes(shift.start);
  const end = toMinutes(shift.end);
  const slots = [];
  for (let t = start; t + durationMinutes <= end; t += SLOT_STEP_MINUTES) {
    slots.push(toHHMM(t));
  }
  return slots;
};

/**
 * Barbeiro está livre para [time, time + duration)?
 * busy: [{ barber_id, start_time, duration_minutes }]
 */
export const isBarberFree = (barberId, time, durationMinutes, busy) => {
  const start = toMinutes(time);
  const end = start + durationMinutes;
  return !busy.some(b =>
    String(b.barber_id) === String(barberId) &&
    overlaps(start, end, toMinutes(b.start_time), toMinutes(b.start_time) + (b.duration_minutes || 30))
  );
};

/** Retorna o primeiro barbeiro livre (para "Sem preferência") ou null. */
export const findFreeBarber = (barberList, time, durationMinutes, busy) =>
  barberList.find(b => isBarberFree(b.id, time, durationMinutes, busy)) || null;

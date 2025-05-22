export interface ModuloOrario {
    id: string; // es. "modulo1", "modulo2"
    label: string; // es. "Modulo 1 (8:30 - 9:20)"
    startTime: string; // "HH:mm" es. "08:30"
    endTime: string;   // "HH:mm" es. "09:20"
}

export const MODULI_ORARI: ModuloOrario[] = [
    { id: 'm1', label: 'Modulo 1 (8:30 - 9:20)', startTime: '08:30', endTime: '09:20' },
    { id: 'm2', label: 'Modulo 2 (9:20 - 10:10)', startTime: '09:20', endTime: '10:10' },
    // 10:10-10:20 intervallo
    { id: 'm3', label: 'Modulo 3 (10:20 - 11:10)', startTime: '10:20', endTime: '11:10' },
    { id: 'm4', label: 'Modulo 4 (11:10 - 12:00)', startTime: '11:10', endTime: '12:00' },
    // 12:00-12:10 intervallo
    { id: 'm5', label: 'Modulo 5 (12:10 - 13:00)', startTime: '12:10', endTime: '13:00' },
    { id: 'm6', label: 'Modulo 6 (13:00 - 13:50)', startTime: '13:00', endTime: '13:50' },
    // 13:50-14:20 pausa pranzo
    { id: 'm7', label: 'Modulo 7 (14:20 - 15:10)', startTime: '14:20', endTime: '15:10' },
    { id: 'm8', label: 'Modulo 8 (15:10 - 16:00)', startTime: '15:10', endTime: '16:00' },
];
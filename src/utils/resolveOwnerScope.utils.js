/**
 * Pure helper: maps an authenticated user's accountType to the
 * test_results column + value used to scope ownership-based queries.
 * Returns null for unknown accountTypes (caller should treat as deny).
 */
export const resolveOwnerScope = (user) => {
  switch (user?.accountType) {
    case 'corporate': return { column: 'hospital_id', value: user.hospitalId }
    case 'doctor':    return { column: 'doctor_id',   value: user.doctorId   }
    case 'patient':   return { column: 'patient_id',  value: user.patientId  }
    default:          return null
  }
}

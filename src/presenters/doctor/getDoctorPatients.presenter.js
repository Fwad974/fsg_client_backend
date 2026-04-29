class GetDoctorPatientsPresenter {
  static present (data) {
    if (!data) return null

    const rows = data.rows?.map(row => ({
      patientId: row.uuid,
      name: [row.firstName, row.lastName].filter(Boolean).join(' '),
      dateOfBirth: row.dateOfBirth,
      mobile: row.user?.phone || null,
      email: row.email
    })) || []

    return {
      message: data.message,
      data: rows,
      count: data.count
    }
  }
}

export default GetDoctorPatientsPresenter

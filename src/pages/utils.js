// ==============================
// COLOR HELPERS
// ==============================


export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'urgent':
      return 'text-red-800 bg-red-100 border-red-300'
    case 'normal':
      return 'text-gray-600 bg-gray-50 border-gray-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}


export const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'in-progress':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'pending':
      return 'text-gray-600 bg-gray-50 border-gray-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}


export const getAttendanceStatusColor = (type) => {
  switch (type) {
    case 'time-in':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'time-out':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'late':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'overtime':
      return 'text-purple-600 bg-purple-50 border-purple-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}


// ==============================
// DATE/TIME HELPERS
// ==============================


export const formatDate = (timestamp, type = 'date') => {
  if (!timestamp) return type === 'date' ? 'No due date' : ''
  
  let date
  if (timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate()
  } else if (timestamp && timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000)
  } else if (timestamp instanceof Date) {
    date = timestamp
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp)
  } else {
    return type === 'date' ? 'Invalid date' : ''
  }


  if (isNaN(date.getTime())) {
    return type === 'date' ? 'Invalid date' : ''
  }


  if (type === 'date') {
    return date.toLocaleDateString()
  } else if (type === 'time') {
    return date.toLocaleTimeString()
  }
  return date.toLocaleString()
}


export const formatTime = (timestamp) => {
  if (!timestamp) return ''
  let date
  if (timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate()
  } else if (timestamp && timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000)
  } else if (timestamp instanceof Date) {
    date = timestamp
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp)
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp)
  } else {
    return ''
  }


  if (isNaN(date.getTime())) {
    return 'Invalid time'
  }
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}


export const formatDuration = (milliseconds) => {
  if (!milliseconds || milliseconds < 0) return '0m'
  const hours = Math.floor(milliseconds / (1000 * 60 * 60))
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}


export const getTimeDifference = (startTime, endTime = new Date()) => {
  let start, end
  if (startTime && typeof startTime.toDate === 'function') {
    start = startTime.toDate()
  } else {
    start = new Date(startTime)
  }
  if (endTime && typeof endTime.toDate === 'function') {
    end = endTime.toDate()
  } else {
    end = new Date(endTime)
  }
  
  const diff = end - start
  if (diff < 0) return 'Invalid time range'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ago`
  } else if (minutes > 0) {
    return `${minutes}m ago`
  } else {
    return 'Just now'
  }
}


export const isToday = (timestamp) => {
  if (!timestamp) return false
  let date
  if (timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate()
  } else {
    date = new Date(timestamp)
  }
  const today = new Date()
  return date.toDateString() === today.toDateString()
}


export const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}


// ==============================
// ATTENDANCE HELPERS
// ==============================


export const getCurrentShiftType = (shiftSchedule) => {
  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 5) // "HH:MM"
  
  if (
    currentTime >= shiftSchedule.morning.start &&
    currentTime <= shiftSchedule.morning.end
  ) {
    return 'Morning Shift'
  } else if (
    currentTime >= shiftSchedule.evening.start &&
    currentTime <= shiftSchedule.evening.end
  ) {
    return 'Evening Shift'
  }
  return 'Outside Shift Hours'
}


export const getWorkHoursStatus = (timeIn, timeOut = new Date()) => {
  if (!timeIn) return 'Not clocked in'
  
  const now = new Date()
  const clockIn = timeIn && typeof timeIn.toDate === 'function' ? timeIn.toDate() : new Date(timeIn)
  
  if (timeOut) {
    const clockOut = timeOut && typeof timeOut.toDate === 'function' ? timeOut.toDate() : new Date(timeOut)
    const duration = clockOut - clockIn
    return `Worked ${formatDuration(duration)}`
  } else {
    const currentDuration = now - clockIn
    return `Working for ${formatDuration(currentDuration)}`
  }
}


// ==============================
// NEW: LATE / OVERTIME LOGIC
// ==============================


export const evaluateAttendance = (timeIn, timeOut, shift, grace = { in: 0, out: 0 }) => {
  if (!shift) return { status: 'Unknown', lateMinutes: 0, overtimeMinutes: 0 }

  const todayKey = getDateKey(new Date())
  const scheduledIn = new Date(`${todayKey}T${shift.start}:00`)
  const scheduledOut = new Date(`${todayKey}T${shift.end}:00`)

  const actualIn = new Date(timeIn)
  const actualOut = new Date(timeOut)

  let lateMinutes = 0
  let overtimeMinutes = 0
  let status = 'On Time'

  if (actualIn > scheduledIn) {
    lateMinutes = Math.floor((actualIn - scheduledIn) / 60000)
    if (lateMinutes > grace.in) {
      status = 'Late'
    }
  }

  if (actualOut > scheduledOut) {
    overtimeMinutes = Math.floor((actualOut - scheduledOut) / 60000)
    if (overtimeMinutes > grace.out) {
      status = status === 'Late' ? 'Late + Overtime' : 'Overtime'
    }
  }

  return {
    status,
    lateMinutes,
    overtimeMinutes
  }
}


// ==============================
// RECORD HELPERS
// ==============================


export const formatAttendanceRecord = (record) => {
  return {
    ...record,
    formattedDate: formatDate(record.timestamp, 'date'),
    formattedTimeIn: formatTime(record.timeIn),
    formattedTimeOut: record.timeOut ? formatTime(record.timeOut) : '-',
    formattedDuration:
      record.timeIn && record.timeOut
        ? formatDuration(new Date(record.timeOut) - new Date(record.timeIn))
        : null
  }
}


// ==============================
// EXPORT HELPERS
// ==============================


export const exportToCSV = (records, filename = 'attendance.csv') => {
  if (!records || records.length === 0) return

  const escapeCSV = (value) => {
    const str = String(value ?? '');
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = Object.keys(records[0]).join(',')
  const rows = records.map(r => Object.values(r).map(escapeCSV).join(','))
  const csvContent = [headers, ...rows].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}


// Map geolocation error codes to messages
export const getLocationErrorMessage = (error) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access denied. Please enable location permissions.'
    case error.POSITION_UNAVAILABLE:
      return 'Location information is unavailable.'
    case error.TIMEOUT:
      return 'Location request timed out.'
    default:
      return 'An unknown error occurred while retrieving location.'
  }
}


// New helper for date key
export const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

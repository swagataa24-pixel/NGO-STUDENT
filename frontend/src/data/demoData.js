export const initialStudents = [
  {
    id: 'stu-001',
    name: 'Aarav Wankhede',
    photoUrl: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=600&q=80',
    age: 9,
    className: 'Class 3',
    center: 'Personal Classroom',
    centerId: 'personal-workspace',
    guardianName: 'Meena Wankhede',
    guardianContact: '+91 98765 12001',
    enrollmentDate: '2023-06-12',
    attended: 18,
    conducted: 30,
    note: 'Reads short Hindi paragraphs independently.',
    progress: ['Reading confidence improved', 'Needs writing practice twice a week'],
    active: true
  },
  {
    id: 'stu-002',
    name: 'Riya Meshram',
    photoUrl: 'https://images.unsplash.com/photo-1597436042432-1a37c2a1cb8a?auto=format&fit=crop&w=600&q=80',
    age: 8,
    className: 'Class 2',
    center: 'Evening Class',
    centerId: 'evening-class',
    guardianName: 'Sanjay Meshram',
    guardianContact: '+91 98765 12002',
    enrollmentDate: '2024-01-10',
    attended: 12,
    conducted: 30,
    note: 'Participation is strong during guided practice.',
    progress: ['Enjoys group reading', 'Attendance needs guardian follow-up'],
    active: true
  },
  {
    id: 'stu-003',
    name: 'Kabir Sheikh',
    photoUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=600&q=80',
    age: 10,
    className: 'Class 4',
    center: 'Personal Classroom',
    centerId: 'personal-workspace',
    guardianName: 'Farida Sheikh',
    guardianContact: '+91 98765 12003',
    enrollmentDate: '2022-11-04',
    attended: 24,
    conducted: 32,
    note: 'Strong in arithmetic and collaborative practice.',
    progress: ['Math milestone reached', 'Leadership in group activities'],
    active: true
  },
  {
    id: 'stu-004',
    name: 'Anaya Thakur',
    photoUrl: 'https://images.unsplash.com/photo-1602030028438-4cf153cbae9e?auto=format&fit=crop&w=600&q=80',
    age: 7,
    className: 'Class 1',
    center: 'Bridge Class',
    centerId: 'bridge-class',
    guardianName: 'Lata Thakur',
    guardianContact: '+91 98765 12004',
    enrollmentDate: '2024-07-01',
    attended: 9,
    conducted: 28,
    note: 'Needs gentle support with classroom routine.',
    progress: ['Recognizes letters', 'Intervention note created for attendance'],
    active: true
  }
];

export const initialClasses = [
  {
    id: 'class-1-primary',
    name: 'Class 1',
    center: 'Bridge Class',
    centerId: 'bridge-class',
    teacher: 'Demo Teacher',
    schedule: 'Mon, Wed, Fri',
    description: 'Foundational letters, classroom routine, and early numeracy.'
  },
  {
    id: 'class-2-evening',
    name: 'Class 2',
    center: 'Evening Class',
    centerId: 'evening-class',
    teacher: 'Demo Teacher',
    schedule: 'Tue, Thu, Sat',
    description: 'Reading confidence, group participation, and number practice.'
  },
  {
    id: 'class-3-primary',
    name: 'Class 3',
    center: 'Personal Classroom',
    centerId: 'personal-workspace',
    teacher: 'Demo Teacher',
    schedule: 'Mon to Fri',
    description: 'Reading fluency, writing practice, and attendance follow-up.'
  },
  {
    id: 'class-4-primary',
    name: 'Class 4',
    center: 'Personal Classroom',
    centerId: 'personal-workspace',
    teacher: 'Demo Teacher',
    schedule: 'Mon to Fri',
    description: 'Arithmetic, peer learning, and independent study habits.'
  }
];

export const volunteers = [
  { name: 'Nisha Rao', role: 'Reading Teacher', center: 'Personal Classroom', availability: 'Mon-Fri', hours: 28 },
  { name: 'Dev Kulkarni', role: 'Math Teacher', center: 'Evening Class', availability: 'Tue-Thu', hours: 18 },
  { name: 'Farah Khan', role: 'Class Teacher', center: 'Bridge Class', availability: 'Mon-Sat', hours: 22 }
];

export const gallerySeed = [
  {
    id: 'photo-1',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=80',
    caption: 'Reading circle and peer support activity',
    center: 'Personal Classroom',
    date: '2026-06-08',
    activity: 'Classroom session'
  },
  {
    id: 'photo-2',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
    caption: 'Teacher-led numeracy session',
    center: 'Evening Class',
    date: '2026-06-14',
    activity: 'Math support'
  },
  {
    id: 'photo-3',
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80',
    caption: 'Monthly review and learning milestone day',
    center: 'Bridge Class',
    date: '2026-06-19',
    activity: 'Monthly review'
  }
];

import { Profile, Task, Channel, Message, NotificationItem } from './database.types';

// Mock layer is strictly compiled and loaded ONLY in DEV mode with VITE_DEMO_MODE=true
export const isDemoMode = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true';

export const MOCK_PROFILES: Record<string, Profile> = (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true')
  ? {
      'admin@zewailcity.edu.eg': {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        email: 'admin@zewailcity.edu.eg',
        full_name: 'Dr. Mostafa (Club Advisor)',
        avatar_url: null,
        phone: '+20 100 123 4567',
        role: 'admin',
        group_id: null,
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      'kareem.vd@zewailcity.edu.eg': {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        email: 'kareem.vd@zewailcity.edu.eg',
        full_name: 'Kareem Tarek',
        avatar_url: null,
        phone: '+20 101 234 5678',
        role: 'head',
        group_id: '11111111-1111-1111-1111-111111111111', // Vehicle Dynamics
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      'omar.member@zewailcity.edu.eg': {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        email: 'omar.member@zewailcity.edu.eg',
        full_name: 'Omar Sherif',
        avatar_url: null,
        phone: '+20 102 345 6789',
        role: 'member',
        group_id: '11111111-1111-1111-1111-111111111111', // Vehicle Dynamics
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      'ziad.new@zewailcity.edu.eg': {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        email: 'ziad.new@zewailcity.edu.eg',
        full_name: 'Ziad Mohamed',
        avatar_url: null,
        phone: '+20 103 456 7890',
        role: 'pending',
        group_id: null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }
  : {};

export const INITIAL_DEMO_TASKS: Task[] = (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true')
  ? [
      {
        id: 'task-101',
        group_id: '11111111-1111-1111-1111-111111111111',
        creator_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        title: 'Double Wishbone Suspension Kinematics Simulation',
        description: 'Perform bump steer, roll center migration, and camber recovery simulation in Lotus Shark. Validate with tire envelope.',
        task_type: 'design',
        priority: 'high',
        status: 'in_progress',
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        links: [{ title: 'Lotus Shark Model CAD', url: 'https://cad.onshape.com/sample-suspension' }],
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        assignees: [
          {
            id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            email: 'omar.member@zewailcity.edu.eg',
            full_name: 'Omar Sherif',
            avatar_url: null,
            phone: null,
            role: 'member',
            group_id: '11111111-1111-1111-1111-111111111111',
            status: 'approved',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      },
      {
        id: 'task-102',
        group_id: '11111111-1111-1111-1111-111111111111',
        creator_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        title: 'Front Brake Caliper Mounting Bracket FEA',
        description: 'Simulate structural stress during 1.5G panic deceleration. Factor of safety must exceed 2.2 on 7075-T6 aluminum.',
        task_type: 'report',
        priority: 'urgent',
        status: 'submitted',
        deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        links: [{ title: 'FEA Boundary Conditions PDF', url: 'https://storage.example.com/fea-caliper.pdf' }],
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        assignees: [
          {
            id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            email: 'omar.member@zewailcity.edu.eg',
            full_name: 'Omar Sherif',
            avatar_url: null,
            phone: null,
            role: 'member',
            group_id: '11111111-1111-1111-1111-111111111111',
            status: 'approved',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      },
    ]
  : [];

export const INITIAL_DEMO_SUBMISSIONS: Record<string, any[]> = (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true')
  ? {
      'task-102': [
        {
          id: 'sub-201',
          task_id: 'task-102',
          submitted_by: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          version_number: 1,
          submission_type: 'file',
          content: 'https://storage.example.com/caliper-bracket-v1.step',
          notes: 'Initial Ansys mesh complete. Von Mises stress peaks at 210 MPa near bolt lugs.',
          review_status: 'changes_requested',
          review_feedback: 'Fillet radii at the top ear are too sharp (3mm). Increase to 6mm to eliminate stress concentration.',
          reviewed_by: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          reviewed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          submitter: {
            id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            full_name: 'Omar Sherif',
            role: 'member',
          },
        },
        {
          id: 'sub-202',
          task_id: 'task-102',
          submitted_by: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          version_number: 2,
          submission_type: 'file',
          content: 'https://storage.example.com/caliper-bracket-v2-revised.step',
          notes: 'Updated fillets to 6mm radius. Max stress dropped to 164 MPa (SF = 2.45). Ready for final review.',
          review_status: 'pending',
          review_feedback: null,
          reviewed_by: null,
          reviewed_at: null,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          submitter: {
            id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            full_name: 'Omar Sherif',
            role: 'member',
          },
        },
      ],
    }
  : {};

export const INITIAL_DEMO_COMMENTS: Record<string, any[]> = (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true')
  ? {
      'task-101': [
        {
          id: 'comm-301',
          task_id: 'task-101',
          author_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          content: 'Keep kingpin inclination under 7 degrees to avoid steering kickback.',
          attachment_url: null,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          author: {
            id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            full_name: 'Kareem Tarek',
            role: 'head',
          },
        },
      ],
    }
  : {};

export const INITIAL_CHANNELS: Channel[] = (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true')
  ? [
      {
        id: 'ch-announcements',
        name: 'Mission Control Announcements',
        slug: 'announcements',
        channel_type: 'announcements',
        group_id: null,
        description: 'Official club-wide updates, competition deadlines, and general announcements. Read-only for engineers.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'ch-pit-wall-heads',
        name: 'Pit Wall (Heads Only)',
        slug: 'pit-wall-heads',
        channel_type: 'heads_only',
        group_id: null,
        description: 'Cross-group leadership coordination channel for Sub-team Heads and Club Admins.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'ch-vd',
        name: 'Vehicle Dynamics Telemetry',
        slug: 'ch-vehicle-dynamics',
        channel_type: 'group',
        group_id: '11111111-1111-1111-1111-111111111111',
        description: 'Suspension kinematics, steering, brake balance, and tire data discussion.',
        created_at: new Date().toISOString(),
      },
    ]
  : [];

export const INITIAL_MESSAGES: Message[] = (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true')
  ? [
      {
        id: 'msg-1',
        channel_id: 'ch-announcements',
        conversation_id: null,
        sender_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        content: 'Welcome to the 2026 Season workspace. All sub-teams must finalize concept designs by Oct 30.',
        attachment_url: null,
        attachment_name: null,
        attachment_type: null,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        sender: {
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          full_name: 'Dr. Mostafa (Advisor)',
          email: 'admin@zewailcity.edu.eg',
          role: 'admin',
          avatar_url: null,
          phone: null,
          group_id: null,
          status: 'approved',
          created_at: '',
          updated_at: '',
        },
      },
    ]
  : [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true')
  ? [
      {
        id: 'notif-1',
        user_id: 'any',
        type: 'announcement',
        title: 'Design Freeze Approaching',
        message: 'Official design freeze for Formula Student UK is in 45 days. Review your sub-team tasks.',
        link: null,
        is_read: false,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ]
  : [];

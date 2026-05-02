import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

interface JoinRequest {
  id: string;
  playerName: string;
  gameId: string;
  phone?: string;
  email?: string;
  tournamentId: string;
  tournamentTitle: string;
  status: 'pending' | 'approved';
  roomId?: string;
  roomPass?: string;
  timestamp: number;
}

interface Tournament {
  id: string;
  title: string;
  prize: string;
  date: string;
  slots: string;
  type: 'Solo' | 'Duo' | 'Squad';
  status: 'Open' | 'Full' | 'Ongoing';
  entryFee: number;
  image: string;
}

const generateInitialTournaments = (): Tournament[] => {
  const list: Tournament[] = [];
  const modes: ('Solo' | 'Duo' | 'Squad')[] = ['Solo', 'Duo', 'Squad'];
  const gameTypes = ['BR', 'CS', 'Lone Wolf'];
  const entryFees = [0, 199, 499, 1999];
  
  // 1. Big Tournaments (Main Layer) - 5 Rooms
  for (let i = 1; i <= 5; i++) {
    list.push({
      id: `big-${i}`,
      title: `GRAND CHAMPIONSHIP #${i}`,
      prize: '₹1,00,000',
      date: 'MAY 15',
      slots: '0/100',
      type: 'Squad',
      status: 'Open',
      entryFee: 10000,
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800'
    });
  }

  // 2. Rupee Categories (10 Rooms Each)
  entryFees.forEach(fee => {
    for (let i = 1; i <= 10; i++) {
      const mode = modes[i % modes.length];
      const category = fee === 0 ? "FREE" : `₹${fee}`;
      list.push({
        id: `fee-${fee}-${i}`,
        title: `${category} BATTLE ROOM #${i}`,
        prize: fee === 0 ? '₹500' : `₹${fee * 5}`,
        date: 'DAILY',
        slots: `0/${mode === 'Solo' ? 50 : mode === 'Duo' ? 48 : 48}`,
        type: mode,
        status: 'Open',
        entryFee: fee,
        image: 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?auto=format&fit=crop&q=80&w=800'
      });
    }
  });

  // 3. Special Categories (BR, CS, Lone Wolf - 5 Rooms Each)
  gameTypes.forEach(gType => {
    for (let i = 1; i <= 5; i++) {
       const fee = entryFees[i % entryFees.length];
       list.push({
        id: `type-${gType.replace(' ', '')}-${i}`,
        title: `${gType.toUpperCase()} ELITE #${i}`,
        prize: fee === 0 ? '₹200' : `₹${fee * 3}`,
        date: 'WEEKLY',
        slots: `0/48`,
        type: 'Squad',
        status: 'Open',
        entryFee: fee,
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800'
      });
    }
  });

  return list;
};

let tournaments: Tournament[] = generateInitialTournaments();

// In-memory store (volatile, but works for demo)
let joinRequests: JoinRequest[] = [];
let tournamentRooms: Record<string, { roomId: string; roomPass: string }> = {
  '1': { roomId: '12567837', roomPass: '134' },
  '2': { roomId: '6896893', roomPass: '648' },
  '3': { roomId: '13799368', roomPass: '573' },
  '4': { roomId: '24789358', roomPass: '679' },
};

const TOURNAMENT_FEES: Record<string, number> = {
  '1': 50,
  '2': 30,
  '3': 80,
  '4': 200,
};

interface SenseiData {
  name: string;
  bio: string;
  advice: string;
  avatar?: string;
}

interface UserData {
  name: string;
  avatar?: string;
  tags?: string[];
  sensei?: SenseiData;
  coins: number;
  redeemedCodes: string[];
  weeklyRedeemCount: number;
  lastRedeemWeek: number;
  friends: Friend[];
  friendRequests: FriendRequest[];
  history: any[];
  achievements: any[];
}

interface Friend {
  uid: string;
  name: string;
  status: 'online' | 'offline';
}

interface FriendRequest {
  fromUid: string;
  fromName: string;
  timestamp: number;
}

interface TournamentInvite {
  fromUid: string;
  fromName: string;
  tournamentId: string;
  tournamentTitle: string;
  timestamp: number;
}

interface PaymentRequest {
  id: string;
  email: string;
  amount: number;
  proof: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
}

let users: Record<string, UserData> = {};
let paymentRequests: PaymentRequest[] = [];

const REDEEM_CODES = ['gtworrior', '0glenk0', 'ytglenkyt', 'skytbhai', '12op12', '0boss0'];
const WEEKLY_COIN_LIMIT = 200;

function getWeekNumber(d: Date) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

const indianNames = [
  "Aarav", "Vihaan", "Ananya", "Diya", "Advik", "Kabir", "Anika", "Navya", "Ayaan", "Shaurya",
  "Myra", "Aarohi", "Ira", "Rohan", "Amit", "Rahul", "Priya", "Sneha", "Vikram", "Karan",
  "Pooja", "Aditya", "Neha", "Rohit", "Shruti", "Manish", "Kiran", "Sanjay", "Divya", "Suresh",
  "Ramesh", "Riya", "Arjun", "Karthik", "Manoj", "Kavya", "Deepak", "Ajay", "Vijay", "Akash",
  "Vishal", "Anil", "Sunil", "Prakash", "Rajesh", "Mahesh", "Dinesh", "Nitin", "Gaurav", "Saurabh",
  "Ashish", "Vikas", "Yash", "Ravi", "Abhishek", "Harsh", "Prashant", "Sumit", "Naveen", "Tarun",
  "Varun", "Mohit", "Aryan", "Rishabh", "Ayush", "Dhruv", "Om", "Pranav", "Rudra", "Ishaan",
  "Dev", "Atharva", "Lakshya", "Vedant", "Aakash", "Gautam", "Siddharth", "Rajat", "Nishant", "Akhil",
  "Anurag", "Mayank", "Tushar", "Abhinav", "Shashank", "Prateek", "Ritesh", "Ankit", "Piyush", "Lalit",
  "Hemant", "Bhavesh", "Jatin", "Kunal", "Nikhil", "Praveen", "Sagar", "Sameer", "Sandip", "Santosh"
];

const gamingTags = ["_YT", "_007", "Gaming", "Pro", "Killer", "King", "Queen", "Boss", "Op", "Hacker", "_FF", "Striker"];

let leaderboard = Array.from({ length: 100 }).map((_, i) => {
  const baseName = indianNames[i % indianNames.length];
  const tag = gamingTags[i % gamingTags.length];
  const isPrefix = i % 3 === 0;
  const playerName = isPrefix ? `${tag}_${baseName}` : `${baseName}${tag}`;

  return {
    id: `player_${i}`,
    name: playerName,
    points: 2500 - (i * 15),
    kills: 145 - Math.floor(i * 1.2),
    uid: Math.floor(1000000000 + Math.random() * 9000000000).toString()
  };
});

const top5 = [
  { id: 'p1', name: "Rahul_Boss", points: 2500, kills: 145, uid: "1234567890" },
  { id: 'p2', name: "Pro_Amit", points: 2100, kills: 120, uid: "2345678901" },
  { id: 'p3', name: "Priya_YT", points: 1950, kills: 110, uid: "3456789012" },
  { id: 'p4', name: "Rohan_007", points: 1800, kills: 95, uid: "4567890123" },
  { id: 'p5', name: "Op_Vikram", points: 1650, kills: 88, uid: "5678901234" },
];

for (let i = 0; i < 5; i++) {
  leaderboard[i] = top5[i];
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Socket.io integration
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("disconnect", () => console.log("Client disconnected"));
  });

  // --- User API ---

  app.get("/api/tournaments", (req, res) => {
    res.json(tournaments);
  });

  app.post("/api/user/init", (req, res) => {
    const { userId } = req.body;
    if (!users[userId]) {
      const generatedName = `Agent_${userId.slice(0,4).toUpperCase()}`;
      users[userId] = {
        name: generatedName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        tags: ["Tactician"],
        coins: 0,
        redeemedCodes: [],
        weeklyRedeemCount: 0,
        lastRedeemWeek: getWeekNumber(new Date()),
        friends: [],
        friendRequests: [],
        history: [
          { id: '1', title: 'TRAINING GROUND', result: 'COMPLETED', points: +50, date: new Date(Date.now() - 86400000).toISOString().split('T')[0] }
        ],
        achievements: [
          { id: 'a1', title: 'First Blood', desc: 'Got first kill in a match', rarity: 'common', icon: 'sword' },
          { id: 'a2', title: 'Survivor', desc: 'Placed Top 10 in Solo', rarity: 'rare', icon: 'shield' },
          { id: 'a3', title: 'Deadeye', desc: 'Landed 5 headshots in a single round', rarity: 'epic', icon: 'crosshair' },
          { id: 'a4', title: 'Champion', desc: 'Won a tournament', rarity: 'legendary', icon: 'crown' }
        ]
      };
    }
    res.json(users[userId]);
  });

  app.post("/api/user/update", (req, res) => {
    const { userId, name, avatar, tags, sensei } = req.body;
    if (!users[userId]) return res.status(404).json({ error: "User not found" });
    
    if (name) {
      if (name.length < 3 || name.length > 20) {
        return res.status(400).json({ error: "Name must be 3-20 characters" });
      }
      users[userId].name = name;
    }

    if (avatar) {
      users[userId].avatar = avatar;
    }

    if (tags && Array.isArray(tags)) {
      users[userId].tags = tags;
    }

    if (sensei) {
      users[userId].sensei = sensei;
    }
    
    res.json({ success: true, user: users[userId] });
  });

  app.post("/api/user/redeem", (req, res) => {
    const { userId, code } = req.body;
    const user = users[userId];
    if (!user) return res.status(404).json({ error: "User not found" });

    const cleanCode = code.toLowerCase().trim();
    if (!REDEEM_CODES.includes(cleanCode)) {
      return res.status(400).json({ error: "Invalid redeem code" });
    }

    if (user.redeemedCodes.includes(cleanCode)) {
      return res.status(400).json({ error: "Code already redeemed" });
    }

    const currentWeek = getWeekNumber(new Date());
    if (user.lastRedeemWeek !== currentWeek) {
      user.weeklyRedeemCount = 0;
      user.lastRedeemWeek = currentWeek;
    }

    if (user.weeklyRedeemCount + 100 > WEEKLY_COIN_LIMIT) {
      return res.status(400).json({ error: "Weekly limit of 200 coins reached" });
    }

    user.coins += 100;
    user.weeklyRedeemCount += 100;
    user.redeemedCodes.push(cleanCode);

    res.json({ success: true, coins: user.coins, message: "100 coins added!" });
  });

  app.post("/api/user/payment", (req, res) => {
    const { userId, email, amount, proof } = req.body;
    const newPayment: PaymentRequest = {
      id: Math.random().toString(36).substring(2, 9),
      email,
      amount: Number(amount),
      proof,
      status: 'pending',
      timestamp: Date.now()
    };
    paymentRequests.push(newPayment);
    res.json({ success: true, message: "Payment proof submitted for verification" });
  });

  app.post("/api/friends/request", (req, res) => {
    const { fromUid, fromName, toUid } = req.body;
    if (!users[toUid]) return res.status(404).json({ error: "Target agent not found" });
    
    // Prevent self or duplicate
    if (fromUid === toUid) return res.status(400).json({ error: "Cannot sync with own identity" });
    if (users[toUid].friendRequests.find(r => r.fromUid === fromUid)) return res.status(400).json({ error: "Uplink request already pending" });
    if (users[toUid].friends.find(f => f.uid === fromUid)) return res.status(400).json({ error: "Already synchronized" });

    users[toUid].friendRequests.push({ fromUid, fromName, timestamp: Date.now() });
    
    // Notify target via socket if connected
    io.emit(`notification:${toUid}`, {
      id: Math.random().toString(36).substring(7),
      type: 'friend_request',
      title: 'UPLINK REQUEST',
      message: `${fromName} is requesting tactical synchronization.`,
      timestamp: Date.now(),
      data: { fromUid, fromName }
    });

    res.json({ success: true });
  });

  app.post("/api/friends/accept", (req, res) => {
    const { userId, fromUid, fromName } = req.body;
    const user = users[userId];
    if (!user) return res.status(404).json({ error: "User not found" });

    user.friendRequests = user.friendRequests.filter(r => r.fromUid !== fromUid);
    user.friends.push({ uid: fromUid, name: fromName, status: 'online' });

    // Also add current user to other user's friends list
    if (users[fromUid]) {
      const currentUserName = user.name || "Agent ALPHA";
      users[fromUid].friends.push({ uid: userId, name: currentUserName, status: 'online' });
      io.emit(`notification:${fromUid}`, {
        id: Math.random().toString(36).substring(7),
        type: 'update',
        title: 'UPLINK ESTABLISHED',
        message: `Tactical synchronization with ${currentUserName} verified.`,
        timestamp: Date.now()
      });
    }

    res.json({ success: true, friends: user.friends });
  });

  app.post("/api/friends/reject", (req, res) => {
    const { userId, fromUid } = req.body;
    const user = users[userId];
    if (!user) return res.status(404).json({ error: "User not found" });

    user.friendRequests = user.friendRequests.filter(r => r.fromUid !== fromUid);
    res.json({ success: true });
  });

  app.post("/api/friends/remove", (req, res) => {
    const { userId, friendUid } = req.body;
    const user = users[userId];
    const friend = users[friendUid];
    
    if (user) {
      user.friends = user.friends.filter(f => f.uid !== friendUid);
    }
    if (friend) {
      friend.friends = friend.friends.filter(f => f.uid !== userId);
    }
    
    res.json({ success: true });
  });

  app.post("/api/tournaments/invite", (req, res) => {
    const { fromUid, fromName, toUid, tournamentId, tournamentTitle } = req.body;
    
    io.emit(`notification:${toUid}`, {
      id: Math.random().toString(36).substring(7),
      type: 'invite',
      title: 'COMBAT INVITE',
      message: `${fromName} has requested your presence in ${tournamentTitle}.`,
      timestamp: Date.now(),
      data: { fromUid, fromName, tournamentId, tournamentTitle }
    });

    res.json({ success: true });
  });

  // Simulate real-time leaderboard updates
  setInterval(() => {
    if (io.sockets.sockets.size > 0) {
      const randomIndex = Math.floor(Math.random() * 10); // Focus on top 10 for visibility
      const pointBoost = Math.floor(Math.random() * 50) + 10;
      const killBoost = Math.floor(Math.random() * 3) + 1;
      
      leaderboard[randomIndex].points += pointBoost;
      leaderboard[randomIndex].kills += killBoost;
      
      // Re-sort
      leaderboard.sort((a, b) => b.points - a.points);
      
      io.emit("leaderboard:update", leaderboard);
    }
  }, 10000); // Update every 10 seconds if anyone is connected

  // --- API Routes ---

  // User: Submit Join Request
  app.post("/api/join", async (req, res) => {
    const { playerName, gameId, phone, email, tournamentId, tournamentTitle, userId } = req.body;
    
    if (!playerName || !gameId || !phone || !email || !tournamentId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = users[userId];
    if (!user) return res.status(404).json({ error: "User not found" });

    const fee = TOURNAMENT_FEES[tournamentId] || 0;
    if (user.coins < fee) {
      return res.status(400).json({ error: "Insufficient coins" });
    }

    user.coins -= fee;

    const roomInfo = tournamentRooms[tournamentId];

    const newRequest: JoinRequest = {
      id: Math.random().toString(36).substring(2, 9),
      playerName,
      gameId,
      phone,
      email,
      tournamentId,
      tournamentTitle,
      status: 'approved', // Auto-approve since they paid
      roomId: roomInfo?.roomId,
      roomPass: roomInfo?.roomPass,
      timestamp: Date.now(),
    };

    joinRequests.push(newRequest);

    res.json({ 
      success: true, 
      requestId: newRequest.id, 
      coins: user.coins,
      roomId: roomInfo?.roomId || 'TBA',
      roomPass: roomInfo?.roomPass || 'TBA'
    });
  });

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

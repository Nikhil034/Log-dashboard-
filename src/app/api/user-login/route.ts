import clientPromise from "@/app/lib/mongodb";
import { sendCredentialsMail } from "@/app/utils/Sendmail";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  const {
    email,
    selectedServer,
    selectedProcesses,
    encrypted,
    password,
    flag,
  } = await req.json();
  const client = await clientPromise;
  const db = client.db("logger-db"); // use default db or specify db name
  const usersCollection = db.collection("users");

  console.log("Email: ", email);
  console.log("Selected Server: ", selectedServer); 

  // Check if user already exists
  const existingUser = await usersCollection.findOne({ email });

  if (flag === 1) {
    //1 mean we are checking if the user exists or not
    if (existingUser) {
      console.log("User already exists", existingUser);
      // Find the authorization entry for the selected server
      const serverAuth = existingUser.authorization.find(
        (auth: { serverName: string; }) => auth.serverName === selectedServer
      );
      console.log("Server Authorization: ", serverAuth);
      const processNames = serverAuth ? serverAuth.processes : [];
      console.log("Process Names: ", processNames);
      return NextResponse.json(
        { message: true, data: processNames },
        { status: 409 }
      );
    } else {
      return NextResponse.json({ message: false }, { status: 200 });
    }
  }

  // Construct the authorization object
  const newAuthorizationEntry = {
    serverName: selectedServer,
    processes: selectedProcesses.map((procName: string) => ({
      name: procName,
      status: "active",
    })),
  };

  const now = new Date();

  if (!existingUser) {
    // New user: insert full structure
    await usersCollection.insertOne({
      email,
      password: encrypted,
      authorization: [newAuthorizationEntry],
      lastUpdated: now,
      isDeleted: false,
    });

    await sendCredentialsMail(email, password);
  } else {
    // Existing user: check if server already exists in authorization
    const serverIndex = existingUser.authorization.findIndex(
      (auth: { serverName:string ; }) => auth.serverName === selectedServer
    );

    console.log("Server Index: ", serverIndex);

    if (serverIndex !== -1) {
      const existingProcesses =
        existingUser.authorization[serverIndex].processes;

      console.log("Existing Processes: ", existingProcesses);

      const updatedProcesses = existingProcesses.map((proc: { name: string; }) => {
        if (selectedProcesses.includes(proc.name)) {
          return { ...proc, status: "active" }; // reactivate if re-selected
        } else {
          return { ...proc, status: "revoked" }; // revoke if unselected
        }
      });

      // Add any new processes not already in the list
      const additionalNewProcesses = selectedProcesses
        .filter(
          (proc: string) => !existingProcesses.some((p: { name: string; }) => p.name === proc)
        )
        .map((name: string) => ({ name, status: "active" }));

      const finalProcesses = [...updatedProcesses, ...additionalNewProcesses];

      await usersCollection.updateOne(
        { email, [`authorization.${serverIndex}.serverName`]: selectedServer },
        {
          $set: {
            [`authorization.${serverIndex}.processes`]: finalProcesses,
            lastUpdated: now,
          },
        }
      );
    } else {
      //New server entry
      await usersCollection.updateOne(
        { email },
        {
          $push: { authorization: newAuthorizationEntry } as object,
          $set: { lastUpdated: now },
        }
      );
    }
  }

  return NextResponse.json(
    { message: "User data updated successfully" },
    { status: 200 }
  );
}

export async function PUT(req: Request) {
  const { email,newPassword,encrypted } = await req.json();
  console.log("Email: ", email);
  console.log("Password: ", newPassword);
  console.log("Encrypted: ", encrypted);
  const client = await clientPromise;
  const db = client.db("logger-db");
  const usersCollection = db.collection("users");

  const existingUser = await usersCollection.findOne({ email });

  if (!existingUser) {
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 }
    );
  }

  await usersCollection.updateOne(
    { email },
    { $set: { password: encrypted, lastUpdated: new Date() } }
  );

  await sendCredentialsMail(email, newPassword);

  return NextResponse.json(
    { message: "Password updated successfully" },
    { status: 200 }
  );
}

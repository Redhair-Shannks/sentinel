import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongo";
import mongoose from "mongoose";

// Define an interface for our cached item
interface CachedItem {
  key: string;
  data: any;
  expiresAt: Date;
}

// Define a schema for our cache if it doesn't exist
const CacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true }
});

// Get our model (create if it doesn't exist)
const getCache = () => {
  return mongoose.models.Cache || mongoose.model<CachedItem>("Cache", CacheSchema);
};

// GET endpoint to retrieve cached data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get("key");
    
    if (!key) {
      return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
    }
    
    await connectDB();
    const Cache = getCache();
    
    const cachedItem = await Cache.findOne({ 
      key,
      expiresAt: { $gt: new Date() } // Only get if not expired
    }).lean() as CachedItem | null;
    
    if (!cachedItem) {
      return NextResponse.json({ found: false, data: null });
    }
    
    return NextResponse.json({
      found: true,
      data: cachedItem.data,
      expiresAt: cachedItem.expiresAt
    });
    
  } catch (error) {
    console.error("Cache GET error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to get cached data" },
      { status: 500 }
    );
  }
}

// POST endpoint to store data in cache
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, data, expiryHours = 24 } = body;
    
    if (!key || data === undefined) {
      return NextResponse.json({ error: "Missing key or data" }, { status: 400 });
    }
    
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiryHours);
    
    await connectDB();
    const Cache = getCache();
    
    // Upsert the cache item
    await Cache.findOneAndUpdate(
      { key },
      { key, data, expiresAt },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({
      success: true,
      expiresAt
    });
    
  } catch (error) {
    console.error("Cache POST error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to cache data" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to invalidate cache
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get("key");
    
    if (!key) {
      return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
    }
    
    await connectDB();
    const Cache = getCache();
    
    await Cache.deleteOne({ key });
    
    return NextResponse.json({
      success: true,
      message: "Cache invalidated"
    });
    
  } catch (error) {
    console.error("Cache DELETE error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to invalidate cache" },
      { status: 500 }
    );
  }
} 
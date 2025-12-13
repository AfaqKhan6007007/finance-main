import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import User from '@/models/userModel' 
import { connectToDatabase } from '@/dbConfig/dbConfig'
import { UserJSON } from '@clerk/nextjs/server'


export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)
    const eventType = evt.type
    const userData = evt.data

    console.log("the event type: ",eventType);
console.log("the user data: ", userData);
    // Connect to MongoDB
    await connectToDatabase()

    switch (eventType) {
      case 'user.created':
        await handleUserCreated(userData as UserJSON)
        break
      case 'user.updated':
        await handleUserUpdated(userData as UserJSON)
        break
      case 'user.deleted':
        await handleUserDeleted(userData as UserJSON) 
        break
      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return new Response('Webhook received and processed', { status: 200 })
  } catch (err) {
    console.error('Error processing webhook:', err)
    return new Response('Error processing webhook', { status: 400 })
  }
}

// Handle user creation
async function handleUserCreated(userData: UserJSON) {
  try {
    const {
      id: clerkId,
      first_name: firstName,
      last_name: lastName,
      username,
      email_addresses,
      image_url: profile_image_url
    } = userData

    // Get primary email
    const primaryEmail = email_addresses.find((email) => email.id === userData.primary_email_address_id)
    const email = primaryEmail ? primaryEmail.email_address : email_addresses[0]?.email_address

    // Create user in MongoDB
    const newUser = new User({
      clerkId,
      firstName: firstName || '',
      lastName: lastName || '',
      username: username || email?.split('@')[0] || `user_${clerkId.slice(0, 8)}`,
      email,
      profile_image_url: profile_image_url || '',
      emailVerified: userData.email_addresses?.[0]?.verification?.status === 'verified' ? new Date() : null
    })

    await newUser.save()
    console.log(`User created in MongoDB: ${clerkId}`)
  } catch (error) {
    console.error('Error creating user in MongoDB:', error)
    throw error
  }
}

// Handle user update
async function handleUserUpdated(userData: UserJSON) {
  try {
    const {
      id: clerkId,
      first_name: firstName,
      last_name: lastName,
      username,
      email_addresses,
      image_url: profile_image_url
    } = userData

    // Get primary email
    const primaryEmail = email_addresses.find((email) => email.id === userData.primary_email_address_id)
    const email = primaryEmail ? primaryEmail.email_address : email_addresses[0]?.email_address

    // Update user in MongoDB
    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      {
        firstName: firstName || '',
        lastName: lastName || '',
        username: username || email?.split('@')[0] || `user_${clerkId.slice(0, 8)}`,
        email,
        profile_image_url: profile_image_url || '',
        emailVerified: userData.email_addresses?.[0]?.verification?.status === 'verified' ? new Date() : null,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      console.warn(`User not found for update: ${clerkId}`)
      // Optionally create the user if not found
      await handleUserCreated(userData)
      return
    }
    console.log(`User updated in MongoDB: ${clerkId}`)
  } catch (error) {
    console.error('Error updating user in MongoDB:', error)
    throw error
  }
}

// Handle user deletion
async function handleUserDeleted(userData:  UserJSON) {
  try {
    const { id: clerkId } = userData

    // Delete user from MongoDB
    const result = await User.findOneAndDelete({ clerkId })

    if (!result) {
      console.warn(`User not found for deletion: ${clerkId}`)
      return
    }

    console.log(`User deleted from MongoDB: ${clerkId}`)
  } catch (error) {
    console.error('Error deleting user from MongoDB:', error)
    throw error
  }
}
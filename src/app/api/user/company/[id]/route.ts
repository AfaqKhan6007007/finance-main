import { NextResponse } from "next/server"
import { connectToDatabase } from "@/dbConfig/dbConfig"
import { Company, companySchema } from "@/models/companyModel"
import { Activity } from "@/models/activityModel"
import mongoose from "mongoose"

connectToDatabase()

// PATCH - Update an existing company
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Company ID is required",
        },
        { status: 400 }
      )
    }

    const reqBody = await request.json()
    console.log("the request body: ", reqBody)
    // Validate request body
    const validationResult = companySchema.partial().safeParse(reqBody)

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return NextResponse.json(
        {
          success: false,
          error: firstError.message,
          field: firstError.path[0],
        },
        { status: 400 }
      )
    }

    // Check if company exists
    const existingCompany = await Company.findById(id).session(session)
    if (!existingCompany) {
      return NextResponse.json(
        {
          success: false,
          error: "Company not found",
        },
        { status: 404 }
      )
    }

    // Check for duplicate company name (excluding current company)
    if (validationResult.data.companyName) {
      const existingCompanyWithName = await Company.findOne({
        companyName: { 
          $regex: new RegExp(`^${validationResult.data.companyName}$`, 'i') 
        },
        _id: { $ne: id } // Exclude current company
      }).session(session)

      if (existingCompanyWithName) {
        return NextResponse.json(
          {
            success: false,
            error: "Company with this name already exists",
            field: "companyName",
          },
          { status: 409 }
        )
      }
    }

    // Check for duplicate abbreviation (excluding current company)
    if (validationResult.data.abbreviation) {
      const existingCompanyWithAbbreviation = await Company.findOne({
        abbreviation: { 
          $regex: new RegExp(`^${validationResult.data.abbreviation}$`, 'i') 
        },
        _id: { $ne: id } // Exclude current company
      }).session(session)

      if (existingCompanyWithAbbreviation) {
        return NextResponse.json(
          {
            success: false,
            error: "Abbreviation already in use for another company",
            field: "abbreviation",
          },
          { status: 409 }
        )
      }
    }


     // Check if trying to change isGroup from true to false and has child companies
    if (validationResult.data.isGroup === false && existingCompany.isGroup === true) {
      const childCompaniesCount = await Company.countDocuments({ 
        parentCompany: id 
      }).session(session)
      
      if (childCompaniesCount > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot change company type from parent to regular as it has child companies.",
          },
          { status: 400 }
        )
      }
    }

    // Find what fields are being updated for the activity metadata
    const updatedFields: Record<string, { old: unknown; new: unknown }> = {}
    
    Object.keys(validationResult.data).forEach(key => {
      // don't keep track of editedBy as it would be shown
      if (key === 'editedBy') return
      const newValue = validationResult.data[key as keyof typeof validationResult.data]
      const oldValue = existingCompany[key as keyof typeof existingCompany]
      
      // Only track if the value actually changed
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        // Convert boolean values to "yes"/"no" for activity tracking
        const formatValue = (value: unknown): unknown => {
          if (typeof value === 'boolean') {
            return value ? 'yes' : 'no'
          }
          return value
        }
        
        updatedFields[key] = {
          old: formatValue(oldValue),
          new: formatValue(newValue)
        }
      }
    })

    // Update company in DB
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      validationResult.data,
      { 
        new: true, // Return updated document
        runValidators: true,
        session
      }
    )

    // Create activity for the update if there are actual changes
    if (Object.keys(updatedFields).length > 0 && validationResult.data.editedBy) {
      await Activity.create([{
        companyId: id,
        userId: validationResult.data.editedBy,
        activityType: 'update',
        metadata: {
          updatedFields,
          timestamp: new Date().toISOString()
        }
      }], { session })
      console.log("Company update activity created")
    }

    // Commit transaction
    await session.commitTransaction()

    return NextResponse.json(
      {
        success: true,
        data: updatedCompany,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    await session.abortTransaction()
    const errorMessage =
      error instanceof Error ? error.message : "Error while updating company"
    console.log("error: ", error)
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  } finally {
    session.endSession()
  }
}

// DELETE - Delete a company and all associated accounts and activities
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Company ID is required",
        },
        { status: 400 }
      )
    }

    // Check if company exists
    const existingCompany = await Company.findById(id).session(session)
    if (!existingCompany) {
      return NextResponse.json(
        {
          success: false,
          error: "Company not found",
        },
        { status: 404 }
      )
    }

    if (existingCompany.isGroup) {
    const childCompaniesCount = await Company.countDocuments({ 
        parentCompany: id 
    }).session(session)
    
    if (childCompaniesCount > 0) {
        return NextResponse.json({
        success: false,
        error: "Cannot delete company as it has child companies.",
        }, { status: 400 })
    }
    }

    // Get all accounts associated with this company
    const companyAccounts = await mongoose.connection.collection('accounts')
      .find({ company: id }, { session })
      .toArray()

    const accountIds = companyAccounts.map(account => account._id)

    // Delete all activities associated with the company (company activities)
    await mongoose.connection.collection('activities')
      .deleteMany({ companyId: new mongoose.Types.ObjectId(id) }, { session })

    // Delete all activities associated with the company's accounts (account activities)
    if (accountIds.length > 0) {
      await mongoose.connection.collection('activities')
        .deleteMany({ accountId: { $in: accountIds } }, { session })
    }

    // Delete all accounts associated with the company
    await mongoose.connection.collection('accounts')
      .deleteMany({ company: id }, { session })

    // Delete the company itself
    await Company.findByIdAndDelete(id, { session })

    // Commit transaction
    await session.commitTransaction()

    return NextResponse.json(
      {
        success: true,
        message: "Company and all associated accounts and activities deleted successfully",
        data: {
          deletedAccounts: accountIds.length,
          deletedCompany: existingCompany.companyName
        }
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    await session.abortTransaction()
    const errorMessage =
      error instanceof Error ? error.message : "Error while deleting company"
    console.log("error: ", error)
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  } finally {
    session.endSession()
  }
}

// GET - Get single company by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Company ID is required",
        },
        { status: 400 }
      )
    }

    const company = await Company.findById(id)

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: "Company not found",
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: company,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while fetching company"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
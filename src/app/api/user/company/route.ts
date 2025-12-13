import { NextResponse } from "next/server"
import { connectToDatabase } from "@/dbConfig/dbConfig"
import { Company, companySchema } from "@/models/companyModel"
import { Account } from "@/models/accountModel"
import { Activity } from "@/models/activityModel"
import mongoose from "mongoose"

connectToDatabase()

// GET - Get all companies
export async function GET() {
  try {
    const companies = await Company.find().sort({ createdAt: -1 })

    return NextResponse.json(
      {
        success: true,
        data: companies,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Error while fetching companies"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// POST - Create a new company with default accounts
export async function POST(request: Request) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const reqBody = await request.json()
    // Validate request body
    const validationResult = companySchema.safeParse(reqBody)
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

    // Check if company with same name already exists
    const existingCompany = await Company.findOne({ 
        companyName: { 
            $regex: new RegExp(`^${validationResult.data.companyName}$`, 'i') 
        }
    }).session(session)

    if (existingCompany) {
      return NextResponse.json(
        {
          success: false,
          error: "Company with this name already exists",
          field: "companyName",
        },
        { status: 409 } // 409 Conflict
      )
    }

    const existingAbbrevation = await Company.findOne({ 
        abbreviation: { 
            $regex: new RegExp(`^${validationResult.data.abbreviation}$`, 'i') 
        }
    }).session(session)

    if (existingAbbrevation) {
      return NextResponse.json(
        {
          success: false,
          error: "Abbrevation already in use for another company",
          field: "abbreviation",
        },
        { status: 409 } // 409 Conflict
      )
    }


    // get the company initial from the validation data
    const companyAbbreviation = validationResult.data.abbreviation
    
    
    // Save company in DB
    const newCompany = new Company(validationResult.data)
    const savedCompany = await newCompany.save({ session })
    // Create default accounts for the company
    const defaultAccounts = await createDefaultAccounts(savedCompany._id.toString(), companyAbbreviation, "Administrator", session)

    // Create activity for company creation
    const companyActivity = new Activity({
      companyId: savedCompany._id,
      userId: validationResult.data.createdBy,
      activityType: 'create'
    })
    await companyActivity.save({ session }) 

    // Create activities for account creation
    const accountActivities = defaultAccounts.map(account => ({
      accountId: account._id,
      userId: "Administrator",
      activityType: 'create'
    }))
    
    await Activity.insertMany(accountActivities, { session })

    // Commit transaction
    await session.commitTransaction()

    return NextResponse.json(
      {
        success: true,
        data: {
          company: savedCompany,
          defaultAccounts: defaultAccounts
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    await session.abortTransaction()
    const errorMessage =
      error instanceof Error ? error.message : "Error while creating company"
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


// Helper function to create default accounts
async function createDefaultAccounts(companyId: string, companyInitials: string, createdBy: string, session: mongoose.ClientSession) {
  const defaultAccountsData = [
    {
      id: `Application of Funds (Assets) - ${companyInitials}`,
      disable: false,
      accountName: "Application of Funds (Assets)",
      accountNumber: "",
      isGroup: true,
      company: companyId,
      taxRate: "",
      currency: "none",
      parentAccount: "a",
      accountType: "none",
      balanceMustBe: "none",
      rootType: "Asset",
      reportType: "Balance Sheet",
      frozen: "no",
      createdBy: "Administrator",
      editedBy: "Administrator"
    },
    {
      id: `Source of Funds (Liabilities) - ${companyInitials}`,
      disable: false,
      accountName: "Source of Funds (Liabilities)",
      accountNumber: "",
      isGroup: true,
      company: companyId,
      taxRate: "",
      currency: "none",
      parentAccount: "a",
      accountType: "none",
      balanceMustBe: "none",
      rootType: "Liability",
      reportType: "Balance Sheet",
      frozen: "no",
      createdBy: "Administrator",
      editedBy: "Administrator"
    },
    {
      id: `Equity - ${companyInitials}`,
      disable: false,
      accountName: "Equity",
      accountNumber: "",
      isGroup: true,
      company: companyId,
      taxRate: "",
      currency: "none",
      parentAccount: "a",
      accountType: "none",
      balanceMustBe: "none",
      rootType: "Equity",
      reportType: "Balance Sheet",
      frozen: "no",
      createdBy: "Administrator",
      editedBy: "Administrator"
    },
    {
      id: `Income - ${companyInitials}`,
      disable: false,
      accountName: "Income",
      accountNumber: "",
      isGroup: true,
      company: companyId,
      taxRate: "",
      currency: "none",
      parentAccount: "a",
      accountType: "none",
      balanceMustBe: "none",
      rootType: "Income",
      reportType: "Profit and Loss",
      frozen: "no",
      createdBy: "Administrator",
      editedBy: "Administrator"
    },
    {
      id: `Expense - ${companyInitials}`,
      disable: false,
      accountName: "Expense",
      accountNumber: "",
      isGroup: true,
      company: companyId,
      taxRate: "",
      currency: "none",
      parentAccount: "a",
      accountType: "none",
      balanceMustBe: "none",
      rootType: "Expense",
      reportType: "Profit and Loss",
      frozen: "no",
      createdBy: "Administrator",
      editedBy: "Administrator"
    }
  ]

  const accounts = await Account.insertMany(defaultAccountsData, { session })
  return accounts
}
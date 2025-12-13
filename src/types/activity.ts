interface BaseActivity {
  _id: string
  accountId: string
  userId: string
  createdAt: string
  updatedAt: string
}

interface UpdateActivity extends BaseActivity {
 activityType: "update"
  metadata: {
    updatedFields: Record<string, { old: string; new: string }>
    timestamp: string
  }
}

interface CommentActivity extends BaseActivity {
  activityType: "comment"
  metadata: {
    comment: string
  }
}

interface LikeActivity extends BaseActivity {
  activityType: "like"
  metadata?: undefined
}

interface CreateActivity extends BaseActivity {
  activityType: "create"
  metadata?: undefined
}

export type IActivity =
  | UpdateActivity
  | CommentActivity
  | LikeActivity
  | CreateActivity

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { AdminSocialController } from './admin-social.controller';
import { AdminSocialService } from './admin-social.service';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { ModerationService } from './moderation.service';
import { SocialGateway } from './social.gateway';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Post, PostSchema } from './schemas/post.schema';
import { Follow, FollowSchema } from './schemas/follow.schema';
import { SocialReport, SocialReportSchema } from './schemas/report.schema';
import { SocialStory, StorySchema } from './schemas/story.schema';
import { SocialBookmark, BookmarkSchema } from './schemas/bookmark.schema';
import { SocialGroup, SocialGroupSchema } from './schemas/group.schema';
import { PartnerPage, PartnerPageSchema } from './schemas/partner-page.schema';
import { SocialMessage, SocialMessageSchema } from './schemas/message.schema';
import { AdminSocialLog, AdminLogSchema } from './schemas/admin-log.schema';
import {
  SocialNotification,
  SocialNotificationSchema,
} from './schemas/notification.schema';
import { User, UserSchema } from '../security/users/schemas/user.schema';
import { AuthModule } from '../security/auth/auth.module';

@Module({
  imports: [
    CloudinaryModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: SocialReport.name, schema: SocialReportSchema },
      { name: SocialNotification.name, schema: SocialNotificationSchema },
      { name: SocialStory.name, schema: StorySchema },
      { name: SocialBookmark.name, schema: BookmarkSchema },
      { name: SocialGroup.name, schema: SocialGroupSchema },
      { name: PartnerPage.name, schema: PartnerPageSchema },
      { name: SocialMessage.name, schema: SocialMessageSchema },
      { name: AdminSocialLog.name, schema: AdminLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [
    SocialController,
    AdminSocialController,
    GroupsController,
    PartnersController,
    MessagesController,
    StoriesController,
    NotificationsController,
    BookmarksController,
    SearchController,
  ],
  providers: [
    SocialService,
    AdminSocialService,
    GroupsService,
    PartnersService,
    MessagesService,
    StoriesService,
    NotificationsService,
    BookmarksService,
    ModerationService,
    SocialGateway,
    SearchService,
  ],
  exports: [
    SocialService,
    GroupsService,
    PartnersService,
    MessagesService,
    StoriesService,
    NotificationsService,
    BookmarksService,
    ModerationService,
    SocialGateway,
    SearchService,
  ],
})
export class SocialModule {}

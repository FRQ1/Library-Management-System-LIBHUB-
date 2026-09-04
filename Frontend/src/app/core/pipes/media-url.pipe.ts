import { Pipe, PipeTransform } from '@angular/core';
import { bookCoverUrl, userAvatarUrl } from '../utils/media-url';

@Pipe({ name: 'bookCover', standalone: true })
export class BookCoverPipe implements PipeTransform {
  transform(coverImage: string | null | undefined): string | null {
    return bookCoverUrl(coverImage);
  }
}

@Pipe({ name: 'userAvatar', standalone: true })
export class UserAvatarPipe implements PipeTransform {
  transform(profilePicture: string | null | undefined): string | null {
    return userAvatarUrl(profilePicture);
  }
}

import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserCollectionResponse } from '@core/models';
import { BaseHttpService } from './base-http.service';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BaseHttpService {
  private usersUrl = this.buildUrl('users');

  /**
   * Get user by email
   * @param email The user's email
   * @returns Observable with the user data
   */
  getUserByEmail(email: string): Observable<User | null> {
    const params = new HttpParams().set('email', email);

    return this.getWithJsonLd<UserCollectionResponse>(this.usersUrl, params)
      .pipe(
        map(response => {
          // Check if a member array exists and has at least one user
          if (response.member && response.member.length > 0) {
            const userMember = response.member[0];

            // Convert from the API format to our User interface
            const user: User = {
              id: userMember.id,
              email: userMember.email,
              roles: userMember.roles,
              firstName: userMember.firstName,
              lastName: userMember.lastName,
              isActive: userMember.isActive,
              createdAt: userMember.createdAt,
              updatedAt: userMember.updatedAt,
              orders: userMember.orders,
              username: userMember.email, // Ensure the username is set for compatibility
              client: userMember.client  // Include the client information if available
            };

            return user;
          }
          return null;
        })
      );
  }

  /**
   * Get all users by client code
   * @param clientCode The client's code
   * @returns Observable with the collection of users
   */
  getUsersByClientCode(clientCode: string): Observable<UserCollectionResponse> {
    const params = new HttpParams().set('client.code', clientCode);
    return this.getWithJsonLd<UserCollectionResponse>(this.usersUrl, params);
  }

  /**
   * Get all users (for admins or filtered by client)
   * @param filters Optional filters like pagination, sorting, search
   * @returns Observable with the collection of users
   */
  /**
   * Toggle user active status
   */
  toggleUserActive(userId: string, isActive: boolean): Observable<User> {
    return this.patchWithMergePatch<User>(`${this.usersUrl}/${userId}`, { isActive });
  }

  getUsers(filters?: {
    page?: number;
    itemsPerPage?: number;
    search?: string;
    clientCode?: string;
  }): Observable<UserCollectionResponse> {
    let params = new HttpParams();

    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.itemsPerPage) {
      params = params.set('itemsPerPage', filters.itemsPerPage.toString());
    }
    if (filters?.search) {
      params = params.set('email', filters.search);
    }
    if (filters?.clientCode) {
      params = params.set('client.code', filters.clientCode);
    }

    return this.getWithJsonLd<UserCollectionResponse>(this.usersUrl, params);
  }
}

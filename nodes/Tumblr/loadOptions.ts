import { ILoadOptionsFunctions, INodePropertyOptions, ICredentialsDecrypted } from 'n8n-workflow';
import { TumblrAuthenticator } from './TumblrAuthenticator';

/**
 * Cache for storing loaded options to improve performance
 */
interface OptionCache {
    [key: string]: {
        data: INodePropertyOptions[];
        timestamp: number;
        ttl: number;
    };
}

class LoadOptionsCache {
    private cache: OptionCache = {};
    private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

    get(key: string): INodePropertyOptions[] | null {
        const cached = this.cache[key];
        if (!cached) return null;

        const now = Date.now();
        if (now > cached.timestamp + cached.ttl) {
            delete this.cache[key];
            return null;
        }

        return cached.data;
    }

    set(key: string, data: INodePropertyOptions[], ttl: number = this.DEFAULT_TTL): void {
        this.cache[key] = {
            data,
            timestamp: Date.now(),
            ttl,
        };
    }

    clear(): void {
        this.cache = {};
    }
}

const optionsCache = new LoadOptionsCache();

/**
 * Helper function to get authenticated client
 */
async function getAuthenticatedClient(context: ILoadOptionsFunctions) {
    const credentials = await context.getCredentials('tumblrOAuth2Api');
    const authenticator = new TumblrAuthenticator();
    return await authenticator.authenticate({ data: credentials } as ICredentialsDecrypted);
}

/**
 * Load user's blogs for blog selection dropdown
 */
export async function loadBlogs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const cacheKey = 'user_blogs';

    // Check cache first
    const cached = optionsCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const client = await getAuthenticatedClient(this);

        // Get user info which includes blogs
        const userInfo = await client.userInfo();
        const userData = userInfo.response || userInfo;
        const blogs = userData.user?.blogs || [];

        const blogOptions: INodePropertyOptions[] = blogs.map((blog: any) => ({
            name: `${blog.title || blog.name} (${blog.name})`,
            value: blog.name,
            description: blog.description ?
                (blog.description.length > 100 ?
                    `${blog.description.substring(0, 100)}...` :
                    blog.description) :
                `Blog with ${blog.posts || 0} posts`,
        }));

        // Sort blogs by name for better UX
        blogOptions.sort((a, b) => a.name.localeCompare(b.name));

        // Cache the results
        optionsCache.set(cacheKey, blogOptions);

        return blogOptions;
    } catch (error) {
        // Return empty array on error to prevent UI breaking
        console.error('Failed to load blogs:', error);
        return [];
    }
}

/**
 * Load post types for post type selection dropdown
 */
export async function loadPostTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const postTypes: INodePropertyOptions[] = [
        {
            name: 'Text Post',
            value: 'text',
            description: 'Create a text-based post with title and body content',
        },
        {
            name: 'Photo Post',
            value: 'photo',
            description: 'Create a post with images and optional caption',
        },
        {
            name: 'Quote Post',
            value: 'quote',
            description: 'Create a post featuring a quote with optional source attribution',
        },
        {
            name: 'Link Post',
            value: 'link',
            description: 'Create a post sharing a URL with title and description',
        },
        {
            name: 'Chat Post',
            value: 'chat',
            description: 'Create a post with conversation or dialogue format',
        },
        {
            name: 'Video Post',
            value: 'video',
            description: 'Create a post with video content or embed',
        },
        {
            name: 'Audio Post',
            value: 'audio',
            description: 'Create a post with audio content or music',
        },
    ];

    return postTypes;
}

/**
 * Load post states for post state selection dropdown
 */
export async function loadPostStates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const postStates: INodePropertyOptions[] = [
        {
            name: 'Published',
            value: 'published',
            description: 'Post is immediately published and visible to followers',
        },
        {
            name: 'Draft',
            value: 'draft',
            description: 'Post is saved as a draft for later editing and publishing',
        },
        {
            name: 'Queue',
            value: 'queue',
            description: 'Post is added to the publishing queue for scheduled release',
        },
        {
            name: 'Private',
            value: 'private',
            description: 'Post is published but only visible to the blog owner',
        },
    ];

    return postStates;
}

/**
 * Load content formats for post format selection dropdown
 */
export async function loadContentFormats(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const contentFormats: INodePropertyOptions[] = [
        {
            name: 'HTML',
            value: 'html',
            description: 'Content formatted as HTML with tags and styling',
        },
        {
            name: 'Markdown',
            value: 'markdown',
            description: 'Content formatted using Markdown syntax',
        },
    ];

    return contentFormats;
}

/**
 * Load popular tags for tag suggestions
 */
export async function loadPopularTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const cacheKey = 'popular_tags';

    // Check cache first
    const cached = optionsCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const client = await getAuthenticatedClient(this);

        // Get user's recent posts to extract commonly used tags
        const userInfo = await client.userInfo();
        const userData = userInfo.response || userInfo;
        const blogs = userData.user?.blogs || [];

        const tagCounts: { [tag: string]: number } = {};

        // Collect tags from the user's primary blog
        if (blogs.length > 0) {
            const primaryBlog = blogs[0];
            try {
                const posts = await client.blogPosts(primaryBlog.name, { limit: 50 });
                const postsData = posts.response || posts;
                const blogPosts = postsData.posts || [];

                blogPosts.forEach((post: any) => {
                    if (post.tags && Array.isArray(post.tags)) {
                        post.tags.forEach((tag: string) => {
                            const normalizedTag = tag.toLowerCase().trim();
                            if (normalizedTag.length > 0) {
                                tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
                            }
                        });
                    }
                });
            } catch (error) {
                console.error('Failed to load posts for tag extraction:', error);
            }
        }

        // Convert to options and sort by frequency
        const tagOptions: INodePropertyOptions[] = Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a) // Sort by count descending
            .slice(0, 20) // Limit to top 20 tags
            .map(([tag, count]) => ({
                name: `#${tag}`,
                value: tag,
                description: `Used ${count} time${count !== 1 ? 's' : ''} in recent posts`,
            }));

        // Add some common general tags if user doesn't have many
        if (tagOptions.length < 10) {
            const commonTags = [
                'photography', 'art', 'aesthetic', 'nature', 'music', 'fashion',
                'design', 'inspiration', 'creative', 'lifestyle', 'travel', 'food'
            ];

            commonTags.forEach(tag => {
                if (!tagOptions.find(option => option.value === tag)) {
                    tagOptions.push({
                        name: `#${tag}`,
                        value: tag,
                        description: 'Popular tag suggestion',
                    });
                }
            });
        }

        // Cache the results for 10 minutes
        optionsCache.set(cacheKey, tagOptions, 10 * 60 * 1000);

        return tagOptions;
    } catch (error) {
        console.error('Failed to load popular tags:', error);

        // Return common tags as fallback
        const fallbackTags = [
            'photography', 'art', 'aesthetic', 'nature', 'music', 'fashion',
            'design', 'inspiration', 'creative', 'lifestyle'
        ];

        return fallbackTags.map(tag => ({
            name: `#${tag}`,
            value: tag,
            description: 'Popular tag suggestion',
        }));
    }
}

/**
 * Load queue intervals for queue scheduling
 */
export async function loadQueueIntervals(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const queueIntervals: INodePropertyOptions[] = [
        {
            name: 'Every 15 minutes',
            value: '15m',
            description: 'Publish queued posts every 15 minutes',
        },
        {
            name: 'Every 30 minutes',
            value: '30m',
            description: 'Publish queued posts every 30 minutes',
        },
        {
            name: 'Every hour',
            value: '1h',
            description: 'Publish queued posts every hour',
        },
        {
            name: 'Every 2 hours',
            value: '2h',
            description: 'Publish queued posts every 2 hours',
        },
        {
            name: 'Every 4 hours',
            value: '4h',
            description: 'Publish queued posts every 4 hours',
        },
        {
            name: 'Every 6 hours',
            value: '6h',
            description: 'Publish queued posts every 6 hours',
        },
        {
            name: 'Every 12 hours',
            value: '12h',
            description: 'Publish queued posts every 12 hours',
        },
        {
            name: 'Daily',
            value: '24h',
            description: 'Publish queued posts once per day',
        },
    ];

    return queueIntervals;
}

/**
 * Load user's following list for blog selection
 */
export async function loadFollowingBlogs(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    const cacheKey = 'following_blogs';

    // Check cache first
    const cached = optionsCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    try {
        const client = await getAuthenticatedClient(this);

        // Get user's following list
        const following = await client.userFollowing({ limit: 50 });
        const followingData = following.response || following;
        const blogs = followingData.blogs || [];

        const blogOptions: INodePropertyOptions[] = blogs.map((blog: any) => ({
            name: `${blog.title || blog.name} (${blog.name})`,
            value: blog.name,
            description: blog.description ?
                (blog.description.length > 100 ?
                    `${blog.description.substring(0, 100)}...` :
                    blog.description) :
                `Following blog with ${blog.posts || 0} posts`,
        }));

        // Sort blogs by name for better UX
        blogOptions.sort((a, b) => a.name.localeCompare(b.name));

        // Cache the results for 15 minutes
        optionsCache.set(cacheKey, blogOptions, 15 * 60 * 1000);

        return blogOptions;
    } catch (error) {
        console.error('Failed to load following blogs:', error);
        return [];
    }
}

/**
 * Load draft posts for draft management operations
 */
export async function loadDraftPosts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    try {
        const client = await getAuthenticatedClient(this);

        // Get the blog name from current parameters
        const blogName = this.getCurrentNodeParameter('blogName') as string;
        if (!blogName) {
            return [];
        }

        // Get drafts for the specified blog
        const drafts = await client.blogDrafts(blogName, { limit: 50 });
        const draftsData = drafts.response || drafts;
        const draftPosts = draftsData.posts || [];

        const draftOptions: INodePropertyOptions[] = draftPosts.map((post: any) => {
            const title = post.title || post.summary || `${post.type} post`;
            const truncatedTitle = title.length > 50 ? `${title.substring(0, 50)}...` : title;

            return {
                name: `${truncatedTitle} (${post.type})`,
                value: post.id,
                description: `Draft ${post.type} post created on ${new Date(post.timestamp * 1000).toLocaleDateString()}`,
            };
        });

        return draftOptions;
    } catch (error) {
        console.error('Failed to load draft posts:', error);
        return [];
    }
}

/**
 * Load queue posts for queue management operations
 */
export async function loadQueuePosts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    try {
        const client = await getAuthenticatedClient(this);

        // Get the blog name from current parameters
        const blogName = this.getCurrentNodeParameter('blogName') as string;
        if (!blogName) {
            return [];
        }

        // Get queue for the specified blog
        const queue = await client.blogQueue(blogName, { limit: 50 });
        const queueData = queue.response || queue;
        const queuePosts = queueData.posts || [];

        const queueOptions: INodePropertyOptions[] = queuePosts.map((post: any) => {
            const title = post.title || post.summary || `${post.type} post`;
            const truncatedTitle = title.length > 50 ? `${title.substring(0, 50)}...` : title;
            const scheduledDate = post.scheduled_publish_time ?
                new Date(post.scheduled_publish_time * 1000).toLocaleString() :
                'Not scheduled';

            return {
                name: `${truncatedTitle} (${post.type})`,
                value: post.id,
                description: `Queued ${post.type} post - scheduled for ${scheduledDate}`,
            };
        });

        return queueOptions;
    } catch (error) {
        console.error('Failed to load queue posts:', error);
        return [];
    }
}

/**
 * Clear all cached options (useful for testing or manual cache invalidation)
 */
export function clearOptionsCache(): void {
    optionsCache.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): { keys: string[]; size: number } {
    const cache = (optionsCache as any).cache;
    return {
        keys: Object.keys(cache),
        size: Object.keys(cache).length,
    };
}
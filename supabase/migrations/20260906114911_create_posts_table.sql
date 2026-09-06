-- Create posts table for IPTV reviews
create table public.posts (
  id bigint primary key generated always as identity,
  title text not null,
  excerpt text not null,
  content text not null,
  author text not null,
  date text not null,
  views integer not null default 0,
  rating numeric(2,1) not null default 4.0,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for default sort order
create index idx_posts_created_at on public.posts (created_at desc);

-- Enable Row Level Security
alter table public.posts enable row level security;

-- Public read access (anonymous and authenticated)
create policy "Anyone can read posts"
  on public.posts for select
  using (true);

-- Only service role (server-side) can insert/update/delete.
-- No insert/update/delete policies for anon or authenticated roles,
-- so writes are only possible via the service-role key on the server.

-- Auto-update updated_at on row changes
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_posts_updated
  before update on public.posts
  for each row
  execute function public.handle_updated_at();

-- Seed existing posts from data/posts.json
insert into public.posts (id, title, excerpt, content, author, date, views, rating, featured)
overriding system value
values
  (1, 'XtremeHD IPTV Review 2024',
   'Complete review of XtremeHD IPTV service. Testing streaming quality, channel lineup, and overall reliability.',
   '<h2>XtremeHD IPTV - Full Review</h2><p>XtremeHD has been one of the most talked-about IPTV services in 2024. We put it through rigorous testing over 30 days to bring you this comprehensive review.</p><h3>Streaming Quality</h3><p>The service delivers excellent HD and 4K streaming with minimal buffering. During our tests, we experienced consistent quality across peak and off-peak hours.</p><h3>Channel Lineup</h3><ul><li>8,000+ live TV channels</li><li>30,000+ movies on demand</li><li>5,000+ TV series</li><li>Premium sports channels included</li></ul><h2>Pricing</h2><p>XtremeHD offers competitive pricing with plans starting at $15/month. The annual plan brings the cost down to $10/month, making it one of the most affordable premium options.</p><h3>Pros</h3><ul><li>Excellent streaming quality</li><li>Massive content library</li><li>24/7 customer support</li><li>Multi-device support</li></ul><h3>Cons</h3><ul><li>No free trial available</li><li>EPG can be slow to load</li></ul>',
   'Expert IPTV', 'Jan 15, 2024', 3420, 4.8, true),

  (2, 'BestIPTV Review 2024',
   'In-depth analysis of BestIPTV service. How does it compare to the competition? Full test results inside.',
   '<h2>BestIPTV - Comprehensive Analysis</h2><p>BestIPTV promises premium IPTV service at competitive prices. We tested every aspect to help you decide if it''s worth your money.</p><h3>Performance</h3><p>Overall solid performance with 4K streaming available on most popular channels. Some occasional buffering during major sporting events, but generally reliable.</p><h3>Content Library</h3><ul><li>6,500+ live channels</li><li>25,000+ VOD titles</li><li>International channels from 50+ countries</li></ul><h2>User Experience</h2><p>The interface is clean and easy to navigate. EPG works well and loads quickly. Compatible with all major devices including Firestick, Android, iOS, and Smart TVs.</p><h3>Verdict</h3><p>BestIPTV delivers good value for money with a solid channel lineup and reliable streaming. While not the absolute best in any single category, it''s a well-rounded option.</p>',
   'Tech Reviewer', 'Jan 20, 2024', 2180, 4.6, false),

  (3, 'Apollo Group TV Review',
   'Is Apollo Group TV worth the hype? We tested their service for a full month. Here''s our honest verdict.',
   '<h2>Apollo Group TV - Honest Review</h2><p>Apollo Group TV has gained significant popularity in the IPTV community. Let''s see if the hype is justified.</p><h3>Setup & Installation</h3><p>Getting started with Apollo is straightforward. They provide detailed setup guides for every platform, and their support team responds within hours.</p><h3>Streaming Quality</h3><ul><li>FHD and 4K available</li><li>Anti-freeze technology</li><li>Multiple server locations</li><li>Consistent uptime (99.5%)</li></ul><h2>Channel Coverage</h2><p>Apollo offers extensive coverage with a focus on US, UK, and Canadian channels. Sports fans will appreciate the dedicated sports section with PPV events included.</p><h3>Pros</h3><ul><li>Excellent stability</li><li>Great sports coverage</li><li>Fast channel switching</li></ul><h3>Cons</h3><ul><li>Higher price point</li><li>Limited Latin American content</li></ul>',
   'Streaming Analyst', 'Jan 25, 2024', 1850, 4.5, false),

  (4, 'Top 10 IPTV Apps for Android and iOS',
   'The best IPTV player apps for your mobile devices. Complete testing with pros and cons for each application.',
   '<h2>Best IPTV Apps in 2024</h2><p>Having the right IPTV player app can make or break your streaming experience. Here are our top picks after extensive testing.</p><h3>1. IPTV Smarters Pro</h3><p>The most popular IPTV player with an intuitive interface and multi-format support. Works with virtually every IPTV provider.</p><h3>2. TiviMate</h3><p>Widely considered the best IPTV app for Android. Its modern interface and advanced features make it a top choice for power users.</p><h3>3. GSE Smart IPTV</h3><p>A great option for iOS users with broad format support and a smooth user experience.</p><h2>Feature Comparison</h2><p>Each app has its strengths and weaknesses. Your choice should depend on your specific needs regarding features, interface, and device compatibility.</p>',
   'Mobile Expert', 'Feb 2, 2024', 4210, 4.7, false),

  (5, 'IPTV Security Guide: Protect Your Privacy',
   'Essential security guide for IPTV users. VPN setup, encryption tips and best practices for safe streaming.',
   '<h2>Security in the IPTV World</h2><p>Security is often overlooked by IPTV users. Yet, protecting your privacy while streaming is essential in today''s digital landscape.</p><h3>Why Use a VPN</h3><ul><li>IP address protection</li><li>Traffic encryption</li><li>Access geo-restricted content</li><li>Prevent ISP throttling</li></ul><h2>Best VPNs for IPTV</h2><p>Not all VPNs are equal when it comes to streaming. Here are our recommendations for the best IPTV experience with minimal speed loss.</p><h3>Best Practices</h3><p>Beyond VPN use, follow these best practices: keep your apps updated, avoid unreliable sources, and never share your login credentials with others.</p>',
   'Security Expert', 'Feb 10, 2024', 2950, 4.4, false),

  (6, 'IPTV vs Cable TV: Which Should You Choose?',
   'Detailed comparison between IPTV and traditional cable TV. Advantages, disadvantages and our final verdict for 2024.',
   '<h2>IPTV vs Cable: The Ultimate Comparison</h2><p>Television is evolving rapidly and many households wonder if it''s time to cut the cord and switch from traditional cable to IPTV.</p><h3>IPTV Advantages</h3><ul><li>Generally more affordable</li><li>Larger international content selection</li><li>Flexibility and mobility</li><li>Advanced features (catchup, VOD)</li></ul><h3>Cable Advantages</h3><ul><li>Proven stability</li><li>Local technical support</li><li>No internet dependency</li></ul><h2>Our Verdict</h2><p>For most users, IPTV represents the better value proposition in terms of price-to-performance ratio and flexibility. However, cable remains relevant for those who prioritize absolute stability.</p>',
   'TV Analyst', 'Feb 18, 2024', 3100, 4.3, false);

-- Reset the identity sequence to continue after the seeded IDs
select setval(pg_get_serial_sequence('public.posts', 'id'), (select max(id) from public.posts));

import { useState, useMemo } from 'react';
import { GetStaticProps } from 'next';
import SearchBar from '../components/SearchBar';
import ReportCard from '../components/ReportCard';
import { fetchReportsFromGitHub } from '../lib/github';
import matter from 'gray-matter';

interface Report {
  title: string;
  description: string;
  date: string;
  slug: string;
  author: string;
  tags: string[];
}

interface HomeProps {
  reports: Report[];
}

export default function Home({ reports }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return reports.filter(report => 
      report.title.toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query) ||
      report.author.toLowerCase().includes(query) ||
      report.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery, reports]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 mb-8 text-gray-400">
          <SearchBar onSearch={handleSearch} />
        </div>

        <div className="mt-8 grid gap-6 px-4 sm:px-0 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReports.length > 0 ? (
            filteredReports.map((report, index) => (
              <ReportCard key={index} {...report} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">
                {searchQuery ? 'No reports found matching your search.' : 'No reports available.'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const githubReports = await fetchReportsFromGitHub();
    
    const reports = githubReports
      .filter((file): file is NonNullable<typeof file> => file !== null)
      .map(file => {
        const { data: frontMatter } = matter(file.content);
        return {
          title: frontMatter.title || 'Untitled',
          description: frontMatter.description || '',
          date: frontMatter.date || new Date().toISOString(),
          author: frontMatter.author || 'Anonymous',
          tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : [],
          slug: file.name.replace('.md', '')
        };
      });

    return {
      props: {
        reports
      },
      // Revalidate every hour
      revalidate: 3600
    };
  } catch (error) {
    console.error('Error fetching reports:', error);
    return {
      props: {
        reports: []
      },
      revalidate: 3600
    };
  }
};
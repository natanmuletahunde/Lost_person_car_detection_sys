'use client';

import { Container, Grid, Title, Text, TextInput, Textarea, Button, Box, SimpleGrid,  useMantineColorScheme } from '@mantine/core';
import Image from 'next/image';
import MainFooter from '../../../app/components/MainFooter';
import DashboardHeader from '../dashboard/DashboardHeader';

export default function AboutPage() {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Box bg={isDark ? "dark.8" : "white"} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* --- WRAPPER FOR CONTENT AND SHAPES --- */}
      <Box style={{ flex: 1, position: 'relative', overflowX: 'hidden' }}>
        
        {/* Background Shapes */}
        <Box style={{ position: 'absolute', top: 0, right: 0, width: '55%', height: '700px', backgroundColor: isDark ? '#2C2E33' : '#EAF2FF', clipPath: 'polygon(45% 0, 100% 0, 100% 100%, 0% 80%)', zIndex: 0 }} />
        <Box style={{ position: 'absolute', bottom: 0, left: 0, width: '45%', height: '600px', backgroundColor: isDark ? '#2C2E33' : '#EAF2FF', clipPath: 'polygon(0 15%, 85% 100%, 0 100%)', zIndex: 0 }} />

        <DashboardHeader />

        {/* Main Content Area */}
        <Container size="lg" py={60} style={{ position: 'relative', zIndex: 1 }}>
          <Grid gutter={80} align="flex-start">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={1} size={64} fw={900} mb="xs">About</Title>
              <Text c="dimmed" size="lg" mb={30}>Subheading for description or instructions</Text>
              
              <Text size="sm" fw={700} mb="md">
                Body text for your whole article or post.
              </Text>
              
              <Text size="sm" mb={40} style={{ lineHeight: 1.8, color: isDark ? '#C1C2C5' : '#1A1B1E' }}>
                Excepteur efficient emerging, minim veniam anim aute carefully curated Ginza conversation exquisite perfect nostrud nisi 
                intricate Content. Qui international first-class nulla ut.
              </Text>

              <Box mt={50}>
                <Title order={2} size={32} fw={800} mb="xl">Contact us</Title>
                <form>
                  <SimpleGrid cols={2} mb="md">
                    <TextInput label="First name" placeholder="example" radius="md" size="md" />
                    <TextInput label="Last name" placeholder="Example" radius="md" size="md" />
                  </SimpleGrid>
                  <TextInput label="Email address" placeholder="email@userexample.net" mb="md" radius="md" size="md" />
                  <Textarea label="Your message" placeholder="Enter your question or message" minRows={4} mb="xl" radius="md" />
                  {/* ✅ Curvy Button to match theme */}
                  <Button size="lg" fullWidth radius="xl" color="blue">Submit</Button>
                </form>
              </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Box style={{ borderRadius: 30, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.1)' }}>
                <Image src="/surveillance-man.jpg" alt="Visual" width={600} height={750} layout="responsive" priority />
              </Box>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      <MainFooter />
    </Box>
  );
}
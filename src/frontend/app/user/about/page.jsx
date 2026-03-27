'use client';

import { Container, Grid, Title, Text, TextInput, Textarea, Button, Box, SimpleGrid, Group, Anchor } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';
import MainFooter from '../../../app/components/MainFooter'; 

export default function AboutPage() {
  return (
    <Box bg="white" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* --- WRAPPER FOR CONTENT AND SHAPES --- */}
      <Box style={{ flex: 1, position: 'relative', overflowX: 'hidden' }}>
        
        {/* Background Shapes */}
        <Box style={{ position: 'absolute', top: 0, right: 0, width: '55%', height: '700px', backgroundColor: '#EAF2FF', clipPath: 'polygon(45% 0, 100% 0, 100% 100%, 0% 80%)', zIndex: 0 }} />
        <Box style={{ position: 'absolute', bottom: 0, left: 0, width: '45%', height: '600px', backgroundColor: '#EAF2FF', clipPath: 'polygon(0 15%, 85% 100%, 0 100%)', zIndex: 0 }} />

        {/* Header */}
        <header style={{ height: 90, display: 'flex', alignItems: 'center', position: 'relative', zIndex: 10 }}>
          <Container size="lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Link href="/">
              {/* ✅ ADJUSTED LOGO: Maintain original aspect ratio */}
              <Image 
                src="/logo.jpg" 
                alt="Logo" 
                width={0} 
                height={60} 
                sizes="100vw"
                style={{ width: 'auto', height: '60px', borderRadius: '8px' }} 
              />
            </Link>
            <Group gap="xl">
              <Anchor component={Link} href="/" c="dark" size="sm" fw={600}>Home</Anchor>
              <Anchor href="#" c="dark" size="sm" fw={600}>alerts</Anchor>
              <Anchor href="#" c="dark" size="sm" fw={600}>notification</Anchor>
              <Button component={Link} href="/login" radius="md" color="blue" px="xl">Logout</Button>
            </Group>
          </Container>
        </header>

        {/* Main Content Area */}
        <Container size="lg" py={60} style={{ position: 'relative', zIndex: 1 }}>
          <Grid gutter={80} align="flex-start">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={1} size={64} fw={900} mb="xs">About</Title>
              <Text c="dimmed" size="lg" mb={30}>Subheading for description or instructions</Text>
              
              <Text size="sm" fw={700} mb="md">
                Body text for your whole article or post.
              </Text>
              
              <Text size="sm" mb={40} style={{ lineHeight: 1.8, color: '#1A1B1E' }}>
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
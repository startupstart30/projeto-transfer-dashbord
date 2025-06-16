import { render, screen, waitFor } from '@testing-library/react'
import AdminDashboard from '@/app/admin/page'
import { createClient } from '@supabase/supabase-js'

// Mock do Supabase
jest.mock('@supabase/supabase-js')

describe('AdminDashboard', () => {
  beforeEach(() => {
    // Reset dos mocks antes de cada teste
    jest.clearAllMocks()
  })

  it('deve renderizar os KPIs corretamente', async () => {
    // Mock dos dados do Supabase
    const mockData = {
      totalBookings: 10,
      totalDrivers: 5,
      totalVehicles: 8,
      totalRevenue: 5000,
      maintenanceCount: 2,
    }

    // Mock das chamadas ao Supabase
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: [],
            count: mockData.totalVehicles,
          })),
          data: [],
          count: mockData.totalBookings,
        })),
      })),
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    render(<AdminDashboard />)

    // Verificar se os KPIs são renderizados
    await waitFor(() => {
      expect(screen.getByText('Veículos')).toBeInTheDocument()
      expect(screen.getByText('Motoristas')).toBeInTheDocument()
      expect(screen.getByText('Reservas')).toBeInTheDocument()
      expect(screen.getByText('Receita total')).toBeInTheDocument()
    })
  })

  it('deve mostrar alertas quando houver veículos em manutenção', async () => {
    // Mock dos dados do Supabase
    const mockData = {
      maintenanceCount: 2,
    }

    // Mock das chamadas ao Supabase
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            data: [],
            count: mockData.maintenanceCount,
          })),
        })),
      })),
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabase)

    render(<AdminDashboard />)

    // Verificar se o alerta é mostrado
    await waitFor(() => {
      expect(screen.getByText(/2 em manutenção/)).toBeInTheDocument()
    })
  })

  it('deve renderizar o calendário de reservas', async () => {
    render(<AdminDashboard />)

    // Verificar se o calendário é renderizado
    await waitFor(() => {
      expect(screen.getByText('Calendário de Reservas')).toBeInTheDocument()
    })
  })
}) 
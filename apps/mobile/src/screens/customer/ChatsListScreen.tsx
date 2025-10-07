import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../../navigation/types';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import LoadingScreen from '../../components/ui/LoadingScreen';

type Props = {
  navigation: NativeStackNavigationProp<CustomerStackParamList, 'ChatsList'>;
};

const ChatsListScreen: React.FC<Props> = ({ navigation }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await api.get('/chat/direct/list');
      setChats(response.data || []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  const getLastMessage = (chat: any) => {
    if (chat.messages && chat.messages.length > 0) {
      return chat.messages[0];
    }
    return null;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getProductImage = (chat: any) => {
    if (chat.product?.images) {
      try {
        const images = typeof chat.product.images === 'string' 
          ? JSON.parse(chat.product.images) 
          : chat.product.images;
        return images[0];
      } catch {
        return null;
      }
    }
    return null;
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No Messages Yet</Text>
          <Text style={styles.emptyText}>
            Start a conversation with a farmer from any product page
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const lastMessage = getLastMessage(item);
            const productImage = getProductImage(item);
            const apiBaseUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:3001';

            return (
              <TouchableOpacity
                onPress={() => navigation.navigate('ChatConversation', { chatId: item.id })}
              >
                <Card style={styles.chatCard}>
                  <View style={styles.chatContent}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                      {item.farmer?.avatarUrl ? (
                        <Image 
                          source={{ uri: item.farmer.avatarUrl.startsWith('http') 
                            ? item.farmer.avatarUrl 
                            : `${apiBaseUrl}${item.farmer.avatarUrl}` 
                          }} 
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarText}>
                            {item.farmer?.name?.charAt(0) || 'F'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Chat Info */}
                    <View style={styles.chatInfo}>
                      <View style={styles.chatHeader}>
                        <Text style={styles.farmerName} numberOfLines={1}>
                          {item.farmer?.farmerProfile?.businessName || item.farmer?.name}
                        </Text>
                        {lastMessage && (
                          <Text style={styles.timestamp}>
                            {formatTime(lastMessage.createdAt)}
                          </Text>
                        )}
                      </View>

                      {item.product && (
                        <Text style={styles.productContext} numberOfLines={1}>
                          About: {item.product.name}
                        </Text>
                      )}

                      {lastMessage && (
                        <Text style={styles.lastMessage} numberOfLines={2}>
                          {lastMessage.sender?.name === item.farmer?.name ? '' : 'You: '}
                          {lastMessage.body}
                        </Text>
                      )}
                    </View>

                    {/* Product Image */}
                    {productImage && (
                      <Image 
                        source={{ uri: productImage.startsWith('http') 
                          ? productImage 
                          : `${apiBaseUrl}${productImage}` 
                        }} 
                        style={styles.productImage}
                      />
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { 
    backgroundColor: '#10B981', 
    padding: 16, 
    paddingTop: 48,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  list: { padding: 16 },
  chatCard: { marginBottom: 12 },
  chatContent: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { marginRight: 12 },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#FFFFFF',
  },
  chatInfo: { flex: 1 },
  chatHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 4,
  },
  farmerName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#111827',
    flex: 1,
  },
  timestamp: { 
    fontSize: 12, 
    color: '#6B7280',
    marginLeft: 8,
  },
  productContext: { 
    fontSize: 12, 
    color: '#10B981',
    marginBottom: 4,
  },
  lastMessage: { 
    fontSize: 14, 
    color: '#6B7280',
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: '#E5E7EB',
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 32,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#111827', 
    marginBottom: 8,
  },
  emptyText: { 
    fontSize: 14, 
    color: '#6B7280', 
    textAlign: 'center',
  },
});

export default ChatsListScreen;

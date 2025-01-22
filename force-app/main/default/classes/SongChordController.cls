public with sharing class SongChordController {
    public class SongChordProWrapper {
        @AuraEnabled
        public String chordProContent { get; set; }
        @AuraEnabled
        public String webPlayerLinks { get; set; }
    }

    @AuraEnabled(cacheable=true)
    public static SongChordProWrapper getSongChordPro(Id recordId) {
        SongChordProWrapper wrapper = new SongChordProWrapper();
        
        Song__c song = [SELECT Id, Name, ChordPro_Content__c, Web_Player__c 
                       FROM Song__c 
                       WHERE Id = :recordId 
                       LIMIT 1];
                       
        wrapper.chordProContent = song.ChordPro_Content__c;
        wrapper.webPlayerLinks = song.Web_Player__c;
        
        return wrapper;
    }

    @AuraEnabled
    public static String updateSongChordPro(Id recordId, String chordProContent) {
        try {
            Song__c song = [SELECT Id FROM Song__c 
                          WHERE Id = :recordId 
                          ];
            
            if (!Schema.sObjectType.Song__c.fields.ChordPro_Content__c.isUpdateable()) {
                throw new AuraHandledException('Insufficient permissions to update song content');
            }
            
            song.ChordPro_Content__c = chordProContent;
            update song;
            return 'Success';
        } catch (Exception e) {
            throw new AuraHandledException('Error updating song: ' + e.getMessage());
        }
    }
}
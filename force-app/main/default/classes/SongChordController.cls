public with sharing class SongChordController {
    public class SongChordProWrapper {
        @AuraEnabled
        public String chordProContent { get; set; }
        @AuraEnabled
        public String webPlayerLinks { get; set; }
        @AuraEnabled
        public Decimal defaultFontSize { get; set; }
        @AuraEnabled
        public Decimal defaultScrollSpeed { get; set; }
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

        // Get settings
        SongChordSettings__mdt settings = [
            SELECT DefaultFontSize__c, DefaultScrollSpeed__c
            FROM SongChordSettings__mdt LIMIT 1
        ];

        wrapper.defaultFontSize = settings.DefaultFontSize__c != null ? settings.DefaultFontSize__c : 30;
        wrapper.defaultScrollSpeed = settings.DefaultScrollSpeed__c != null ? settings.DefaultScrollSpeed__c : 0.2;

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